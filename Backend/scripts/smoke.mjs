// Smoke test: hits key endpoints of a RUNNING server and exits non-zero on failure.
// Usage: node scripts/smoke.mjs [baseUrl]   (default http://localhost:3000)
//        SMOKE_URL=https://portal.example.com node scripts/smoke.mjs

const base = (process.env.SMOKE_URL || process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '')
let failures = 0

async function getJson(path) {
  const res = await fetch(base + path)
  let body = null
  try { body = await res.json() } catch { /* not json */ }
  return { res, body }
}

async function expectOk(path) {
  try {
    const { res, body } = await getJson(path)
    if (!res.ok || !body?.ok) {
      console.error(`FAIL ${path} -> ${res.status}`)
      failures++
    } else {
      console.log(`ok   ${path}`)
    }
  } catch (err) {
    console.error(`FAIL ${path} -> ${err.message}`)
    failures++
  }
}

console.log(`Smoke testing ${base}`)
await expectOk('/api/health')
await expectOk('/api/meta')
await expectOk('/api/settings')

// The directory is healthy whether it's public (200) or login-gated (401).
try {
  const { res } = await getJson('/api/directory')
  if (res.status === 200 || res.status === 401) {
    console.log(`ok   /api/directory (${res.status})`)
  } else {
    console.error(`FAIL /api/directory -> ${res.status}`)
    failures++
  }
} catch (err) {
  console.error(`FAIL /api/directory -> ${err.message}`)
  failures++
}

if (failures > 0) {
  console.error(`\n${failures} smoke check(s) failed.`)
  process.exit(1)
}
console.log('\nAll smoke checks passed.')
