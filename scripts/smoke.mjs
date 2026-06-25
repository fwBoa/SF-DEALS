import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

// BASE peut pointer vers une URL distante (ex. https://sf-deals.vercel.app)
// via la variable d'environnement SMOKE_BASE ; sinon on démarre le dev server local.
const BASE = process.env.SMOKE_BASE || 'http://127.0.0.1:5173'
const isRemote = /^https?:\/\//.test(BASE) && !BASE.includes('127.0.0.1') && !BASE.includes('localhost')
const results = []
function ok(name) { results.push({ name, pass: true }) }
function fail(name, err) { results.push({ name, pass: false, err: String(err) }) }

// Démarre le dev server Vite (si pas déjà lancé), attend qu'il réponde.
let viteProc = null
async function ensureDevServer() {
  const up = await fetch(BASE + '/').then((r) => r.ok).catch(() => false)
  if (up) return
  if (isRemote) throw new Error('remote BASE unreachable: ' + BASE)
  viteProc = spawn('npm', ['run', 'dev'], { stdio: 'ignore', detached: true })
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 500))
    if (await fetch(BASE + '/').then((r) => r.ok).catch(() => false)) return
  }
  throw new Error('dev server did not start')
}

await ensureDevServer()

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  locale: 'fr-FR', // force FR pour stabiliser les assertions i18n
})
const page = await context.newPage()
page.on('console', (m) => {
  if (m.type() === 'error') console.log('  [console.error]', m.text())
})
page.on('pageerror', (e) => console.log('  [pageerror]', e.message))

try {
  // 1. root -> redirect to /login
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForURL('**/login', { timeout: 8000 })
  ok('redirect to /login')

  // 2. login
  await page.fill('input[type="email"]', 'dev@sfdeals.local')
  await page.fill('input[type="password"]', 'sfdeals123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/', { timeout: 10000 })
  ok('login -> dashboard')

  // 3. dashboard stats
  try {
    await page.waitForSelector('text=Tableau de bord', { timeout: 20000 })
  } catch (e) {
    await page.screenshot({ path: '/tmp/sf-dashboard-debug.png', fullPage: true })
    const t = (await page.textContent('body')) ?? ''
    throw new Error('dashboard title not found. body snippet: ' + t.slice(0, 300))
  }
  await page.waitForSelector('text=Prospects', { timeout: 20000 })
  const body = await page.textContent('body')
  if (!body || !body.includes('Opportunités')) throw new Error('dashboard stats missing')
  ok('dashboard renders stats + charts')

  // 4. pipeline kanban
  await page.goto(BASE + '/pipeline', { waitUntil: 'networkidle' })
  await page.waitForSelector('text=Pipeline commercial', { timeout: 8000 })
  await page.waitForSelector('text=Lead', { timeout: 8000 })
  ok('pipeline kanban renders columns')

  // 5. liste (opportunités)
  await page.goto(BASE + '/liste', { waitUntil: 'networkidle' })
  await page.waitForSelector('text=Opportunités', { timeout: 8000 })
  await page.waitForSelector('table', { timeout: 8000 })
  const rowCount = await page.locator('table tbody tr').count()
  if (rowCount === 0) throw new Error('liste table empty')
  ok(`liste table has ${rowCount} rows`)

  // 6. entreprises
  await page.goto(BASE + '/entreprises', { waitUntil: 'networkidle' })
  await page.waitForSelector('text=Entreprises', { timeout: 8000 })
  await page.waitForSelector('table', { timeout: 8000 })
  const entRows = await page.locator('table tbody tr').count()
  if (entRows === 0) throw new Error('entreprises table empty')
  ok(`entreprises table has ${entRows} rows`)

  // 7. rappels
  await page.goto(BASE + '/rappels', { waitUntil: 'networkidle' })
  await page.waitForSelector('text=Rappels', { timeout: 8000 })
  ok('rappels page loads')

  // 8. opportunite detail (first row link)
  await page.goto(BASE + '/liste', { waitUntil: 'networkidle' })
  await page.waitForSelector('table tbody tr a', { timeout: 8000 })
  const href = await page.locator('table tbody tr a').first().getAttribute('href')
  if (!href || !href.startsWith('/opportunites/')) throw new Error('no detail link')
  await page.locator('table tbody tr a').first().click()
  await page.waitForURL('**/opportunites/*', { timeout: 8000 })
  await page.waitForSelector('text=Journal', { timeout: 8000 })
  ok('opportunite detail + activity log')

  // 9. i18n toggle EN
  await page.goto(BASE + '/parametres', { waitUntil: 'networkidle' })
  await page.waitForSelector('text=Paramètres', { timeout: 8000 })
  // language toggle: buttons labelled 'fr' / 'en' (lowercase text content)
  const enBtn = page.getByRole('button', { name: 'en', exact: true }).first()
  if (await enBtn.count()) {
    await enBtn.click()
    await page.waitForTimeout(500)
    const enBody = await page.textContent('body')
    if (enBody && enBody.includes('Settings')) ok('i18n FR->EN toggle')
    else fail('i18n FR->EN toggle', 'Settings text not found')
    // toggle back to FR
    await page.getByRole('button', { name: 'fr', exact: true }).first().click().catch(() => {})
  } else {
    fail('i18n toggle', 'no EN button')
  }
} catch (e) {
  fail('unexpected', e)
} finally {
  await browser.close()
  if (viteProc) {
    try { process.kill(-viteProc.pid) } catch {}
  }
}

console.log('\n=== SMOKE TEST RESULTS ===')
let passed = 0
for (const r of results) {
  console.log(`${r.pass ? '✅' : '❌'} ${r.name}${r.pass ? '' : ' — ' + r.err}`)
  if (r.pass) passed++
}
console.log(`\n${passed}/${results.length} passed`)
process.exit(passed === results.length ? 0 : 1)