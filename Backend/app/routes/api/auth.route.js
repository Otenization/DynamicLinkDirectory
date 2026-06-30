import { verifyPassword, generateToken, hashPassword } from '../../../lib/auth.js'

function ensureModels(fastify, reply) {
  if (!fastify.db?.Users || !fastify.db?.Sessions) {
    reply.code(503).send({ ok: false, message: 'Auth is unavailable (database not configured).' })
    return null
  }
  return fastify.db
}

function publicUser(user) {
  return {
    uuid: user.uuid,
    username: user.username,
    display_name: user.display_name,
    role: user.role,
    last_login_at: user.last_login_at,
  }
}

// In-memory login throttle keyed by ip+username. Resets on success; locks after
// too many failures within the window. (Per-process; fine for a single backend.)
const loginAttempts = new Map()

function loginRateConfig(fastify) {
  const c = fastify.config?.auth?.login_rate_limit || {}
  return {
    max: Number(c.max_attempts) || 5,
    windowMs: (Number(c.window_minutes) || 15) * 60000,
    lockoutMs: (Number(c.lockout_minutes) || 15) * 60000,
  }
}

export default async function authRoutes(fastify) {
  const ttlHours = Number(fastify.config?.auth?.session_ttl_hours) || 168

  fastify.post('/login', async (request, reply) => {
    const db = ensureModels(fastify, reply)
    if (!db) return

    const body = request.body || {}
    const username = String(body.username || '').trim()
    const password = String(body.password || '')
    if (!username || !password) {
      return reply.code(400).send({ ok: false, message: 'username and password are required' })
    }

    const { max, windowMs, lockoutMs } = loginRateConfig(fastify)
    const key = `${request.ip}:${username.toLowerCase()}`
    const now = Date.now()
    const rec = loginAttempts.get(key)
    if (rec && rec.lockedUntil > now) {
      const secs = Math.ceil((rec.lockedUntil - now) / 1000)
      reply.header('Retry-After', String(secs))
      return reply.code(429).send({ ok: false, message: `Too many failed attempts. Try again in about ${Math.max(1, Math.round(secs / 60))} minute(s).` })
    }

    // Use the withSecret scope so the hash/salt are available for verification.
    const user = await db.Users.scope('withSecret').findOne({ where: { username } })
    if (!user || !user.is_active || !verifyPassword(password, user.password_hash, user.password_salt)) {
      let r = loginAttempts.get(key)
      if (!r || now - r.firstAt > windowMs) r = { count: 0, firstAt: now, lockedUntil: 0 }
      r.count += 1
      if (r.count >= max) r.lockedUntil = now + lockoutMs
      loginAttempts.set(key, r)
      // Opportunistic cleanup so the map can't grow unbounded.
      if (loginAttempts.size > 5000) {
        for (const [k, v] of loginAttempts) {
          if ((v.lockedUntil || v.firstAt + windowMs) < now) loginAttempts.delete(k)
        }
      }
      return reply.code(401).send({ ok: false, message: 'Invalid username or password.' })
    }

    loginAttempts.delete(key)

    const token = generateToken()
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000)
    await db.Sessions.create({ user_id: user.uuid, token, expires_at: expiresAt })

    user.last_login_at = new Date()
    await user.save()

    return reply.send({
      ok: true,
      data: { token, expires_at: expiresAt, user: publicUser(user) },
    })
  })

  fastify.post('/logout', { preHandler: fastify.authenticate }, async (request, reply) => {
    if (request.session) {
      await request.session.destroy()
    }
    return reply.send({ ok: true, data: { loggedOut: true } })
  })

  fastify.get('/me', { preHandler: fastify.authenticate }, async (request, reply) => {
    return reply.send({ ok: true, data: { user: publicUser(request.user) } })
  })

  // Change the signed-in user's own password.
  fastify.patch('/password', { preHandler: fastify.authenticate }, async (request, reply) => {
    const db = ensureModels(fastify, reply)
    if (!db) return

    const body = request.body || {}
    const current = String(body.current_password || '')
    const next = String(body.new_password || '')
    if (next.length < 6) {
      return reply.code(400).send({ ok: false, message: 'New password must be at least 6 characters.' })
    }

    const user = await db.Users.scope('withSecret').findByPk(request.user.uuid)
    if (!user || !verifyPassword(current, user.password_hash, user.password_salt)) {
      return reply.code(400).send({ ok: false, message: 'Current password is incorrect.' })
    }

    const { hash, salt } = hashPassword(next)
    user.password_hash = hash
    user.password_salt = salt
    await user.save()
    return reply.send({ ok: true, data: { updated: true } })
  })
}
