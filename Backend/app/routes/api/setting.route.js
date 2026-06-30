// Site settings exposed to the public directory (read) and editable by admins (write).
// Stored as key/value rows; GET merges stored values over these defaults so the
// endpoint always returns a complete, sensible object even before anything is saved.
const DEFAULTS = {
  site_title: 'Dynamic Link Directory',
  site_subtitle: 'A simple web portal — browse and jump to the links you need.',
  layout_theme: 'cards',
  // Empty means "use the selected layout's default color" (resolved on the frontend).
  theme_color: '',
  // Whole-site chrome: 'classic' (hero header) or 'topbar' (sticky app bar).
  shell_layout: 'classic',
  // Ambient background palette preset (warm / cool / mint / rose / slate).
  theme_palette: 'warm',
}

const ALLOWED_KEYS = Object.keys(DEFAULTS)

const LOGO_KEY = 'logo'
const MAX_LOGO_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_LOGO_MIME = /^image\/(png|jpe?g|gif|webp|svg\+xml)$/

// Verify the bytes actually look like the declared image type, so an HTML/script
// file can't be stored (and later served) under an image MIME.
function logoBytesMatch(buf, mime) {
  const h = buf.subarray(0, 16)
  if (mime === 'image/png') return h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4e && h[3] === 0x47
  if (mime === 'image/jpeg' || mime === 'image/jpg') return h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff
  if (mime === 'image/gif') return h[0] === 0x47 && h[1] === 0x49 && h[2] === 0x46 && h[3] === 0x38
  if (mime === 'image/webp') return buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP'
  if (mime === 'image/svg+xml') return buf.subarray(0, 1024).toString('utf8').toLowerCase().includes('<svg')
  return false
}

function ensureModel(fastify, reply) {
  if (!fastify.db?.Settings) {
    reply.code(503).send({ ok: false, message: 'Database models are unavailable.' })
    return null
  }
  return fastify.db.Settings
}

export default async function settingRoutes(fastify) {
  // Public: read the current site settings (+ whether a logo is stored).
  fastify.get('/', async (request, reply) => {
    const Settings = ensureModel(fastify, reply)
    if (!Settings) return

    const rows = await Settings.findAll()
    const stored = {}
    for (const row of rows) {
      if (ALLOWED_KEYS.includes(row.key)) stored[row.key] = row.value
    }
    const hasLogo = fastify.db.SiteAssets
      ? (await fastify.db.SiteAssets.count({ where: { key: LOGO_KEY } })) > 0
      : false
    return reply.send({ ok: true, data: { ...DEFAULTS, ...stored, has_logo: hasLogo } })
  })

  // Public: serve the stored logo binary.
  fastify.get('/logo', async (request, reply) => {
    if (!fastify.db?.SiteAssets) {
      return reply.code(503).send({ ok: false, message: 'Database models are unavailable.' })
    }
    const row = await fastify.db.SiteAssets.findByPk(LOGO_KEY)
    if (!row) {
      return reply.code(404).send({ ok: false, message: 'No logo set.' })
    }
    reply.header('Content-Type', row.mime_type)
    reply.header('Cache-Control', 'no-cache')
    // Neutralize any active content (e.g. scripts inside an SVG) if the asset is
    // opened directly, and stop content-type sniffing.
    reply.header('X-Content-Type-Options', 'nosniff')
    reply.header('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox")
    return reply.send(row.data)
  })

  // Admin: upload a logo. Body: { mime_type, data } where data is base64.
  // bodyLimit is raised here so a ~5 MB image (base64 ~6.7 MB) fits.
  fastify.post('/logo', { preHandler: fastify.authenticate, bodyLimit: 8 * 1024 * 1024 }, async (request, reply) => {
    if (!fastify.db?.SiteAssets) {
      return reply.code(503).send({ ok: false, message: 'Database models are unavailable.' })
    }
    const body = request.body || {}
    const mime = String(body.mime_type || '').trim()
    const base64 = String(body.data || '')
    if (!ALLOWED_LOGO_MIME.test(mime)) {
      return reply.code(400).send({ ok: false, message: 'Logo must be a PNG, JPEG, GIF, WebP, or SVG image.' })
    }
    if (!base64) {
      return reply.code(400).send({ ok: false, message: 'No image data provided.' })
    }
    const buf = Buffer.from(base64, 'base64')
    if (buf.length === 0) {
      return reply.code(400).send({ ok: false, message: 'Invalid image data.' })
    }
    if (buf.length > MAX_LOGO_BYTES) {
      return reply.code(413).send({ ok: false, message: 'Logo must be 5 MB or smaller.' })
    }
    if (!logoBytesMatch(buf, mime)) {
      return reply.code(400).send({ ok: false, message: 'File contents do not match the image type.' })
    }
    await fastify.db.SiteAssets.upsert({ key: LOGO_KEY, mime_type: mime, data: buf, size: buf.length })
    return reply.send({ ok: true, data: { size: buf.length, mime_type: mime } })
  })

  // Admin: remove the logo.
  fastify.delete('/logo', { preHandler: fastify.authenticate }, async (request, reply) => {
    if (!fastify.db?.SiteAssets) {
      return reply.code(503).send({ ok: false, message: 'Database models are unavailable.' })
    }
    await fastify.db.SiteAssets.destroy({ where: { key: LOGO_KEY } })
    return reply.send({ ok: true, data: { removed: true } })
  })

  // Admin: update one or more known settings.
  fastify.put('/', { preHandler: fastify.authenticate }, async (request, reply) => {
    const Settings = ensureModel(fastify, reply)
    if (!Settings) return

    const body = request.body || {}
    const updates = ALLOWED_KEYS.filter((key) => body[key] !== undefined)
    if (updates.length === 0) {
      return reply.code(400).send({ ok: false, message: `Provide at least one of: ${ALLOWED_KEYS.join(', ')}` })
    }

    for (const key of updates) {
      await Settings.upsert({ key, value: String(body[key] ?? '') })
    }

    const rows = await Settings.findAll()
    const stored = {}
    for (const row of rows) {
      if (ALLOWED_KEYS.includes(row.key)) stored[row.key] = row.value
    }
    return reply.send({ ok: true, data: { ...DEFAULTS, ...stored } })
  })
}
