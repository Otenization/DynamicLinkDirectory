import { hashPassword } from '../../../lib/auth.js'

function ensureModel(fastify, reply) {
  if (!fastify.db?.Users) {
    reply.code(503).send({ ok: false, message: 'Database models are unavailable.' })
    return null
  }
  return fastify.db.Users
}

function publicUser(u) {
  return {
    uuid: u.uuid,
    username: u.username,
    display_name: u.display_name,
    role: u.role,
    is_active: u.is_active,
    last_login_at: u.last_login_at,
    created_at: u.created_at,
  }
}

function text(v) {
  return String(v ?? '').trim()
}

export default async function userRoutes(fastify) {
  // All user-management routes are admin-only.
  fastify.addHook('preHandler', fastify.requireAdmin)

  fastify.get('/', async (request, reply) => {
    const Users = ensureModel(fastify, reply)
    if (!Users) return
    const rows = await Users.findAll({ order: [['created_at', 'ASC']] })
    return reply.send({ ok: true, data: rows.map(publicUser) })
  })

  fastify.post('/', async (request, reply) => {
    const Users = ensureModel(fastify, reply)
    if (!Users) return

    const body = request.body || {}
    const username = text(body.username)
    const password = String(body.password || '')
    if (!username) return reply.code(400).send({ ok: false, message: 'username is required' })
    if (password.length < 6) return reply.code(400).send({ ok: false, message: 'password must be at least 6 characters' })

    const existing = await Users.findOne({ where: { username } })
    if (existing) return reply.code(409).send({ ok: false, message: 'That username is already taken.' })

    const { hash, salt } = hashPassword(password)
    const row = await Users.create({
      username,
      display_name: text(body.display_name) || username,
      password_hash: hash,
      password_salt: salt,
      role: text(body.role) || 'admin',
      is_active: body.is_active === undefined ? true : Boolean(body.is_active),
    })
    return reply.code(201).send({ ok: true, data: publicUser(row) })
  })

  fastify.patch('/:uuid', async (request, reply) => {
    const Users = ensureModel(fastify, reply)
    if (!Users) return

    const uuid = text(request.params?.uuid)
    const row = await Users.findByPk(uuid)
    if (!row) return reply.code(404).send({ ok: false, message: 'user not found' })

    const body = request.body || {}
    const next = {}
    if (body.display_name !== undefined) next.display_name = text(body.display_name)
    if (body.role !== undefined) next.role = text(body.role) || row.role
    if (body.is_active !== undefined) next.is_active = Boolean(body.is_active)

    // Don't let the last active admin be deactivated or demoted.
    const wouldBeAdmin = next.role !== undefined ? next.role === 'admin' : row.role === 'admin'
    const wouldBeActive = next.is_active !== undefined ? next.is_active : row.is_active
    if (row.role === 'admin' && row.is_active && (!wouldBeAdmin || !wouldBeActive)) {
      const activeAdmins = await Users.count({ where: { role: 'admin', is_active: true } })
      if (activeAdmins <= 1) {
        return reply.code(400).send({ ok: false, message: 'Cannot deactivate or demote the last active admin.' })
      }
    }

    if (body.password !== undefined && String(body.password).length > 0) {
      if (String(body.password).length < 6) {
        return reply.code(400).send({ ok: false, message: 'password must be at least 6 characters' })
      }
      const { hash, salt } = hashPassword(String(body.password))
      next.password_hash = hash
      next.password_salt = salt
    }

    await row.update(next)
    return reply.send({ ok: true, data: publicUser(row) })
  })

  fastify.delete('/:uuid', async (request, reply) => {
    const Users = ensureModel(fastify, reply)
    if (!Users) return

    const uuid = text(request.params?.uuid)
    if (uuid === request.user.uuid) {
      return reply.code(400).send({ ok: false, message: 'You cannot delete your own account.' })
    }
    const row = await Users.findByPk(uuid)
    if (!row) return reply.code(404).send({ ok: false, message: 'user not found' })

    if (row.role === 'admin' && row.is_active) {
      const activeAdmins = await Users.count({ where: { role: 'admin', is_active: true } })
      if (activeAdmins <= 1) {
        return reply.code(400).send({ ok: false, message: 'Cannot delete the last active admin.' })
      }
    }

    await row.destroy()
    return reply.send({ ok: true, data: { uuid } })
  })
}
