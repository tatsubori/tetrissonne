// Headless capture of the screenshot driver page. Assumes the Vite dev server
// is already running (npm run dev, http://localhost:5173). Drives a headless
// Chromium against tools/screenshots/index.html, waits for the driver to signal
// window.__ready, and writes one PNG per shot into docs/images/.
//
//   node tools/screenshots/capture.mjs
//
// Edit the `shots` table below to change which stills are produced.
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { chromium } from 'playwright-core'

// [output filename in docs/images/, driver query string]
const shots = [
  ['mid-game.png', 'seed=7&turns=14&meeples=0.7&w=1280&h=900'],
  ['game-over.png', 'seed=7&state=over&meeples=0.8&w=1280&h=900'],
]

const BASE = process.env.CAPTURE_BASE_URL ?? 'http://localhost:5173'

// playwright-core ships no browser. Find the Chromium that Playwright cached
// under ~/Library/Caches/ms-playwright (prefer the lighter headless shell).
// Override with CHROME_PATH if you have your own build.
function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const cache = join(homedir(), 'Library', 'Caches', 'ms-playwright')
  let dirs = []
  try {
    dirs = readdirSync(cache)
  } catch {
    return null
  }
  const rank = (d) => (d.startsWith('chromium_headless_shell-') ? 0 : d.startsWith('chromium-') ? 1 : 2)
  const candidates = dirs
    .filter((d) => d.startsWith('chromium_headless_shell-') || d.startsWith('chromium-'))
    .sort((a, b) => rank(a) - rank(b) || b.localeCompare(a)) // newest build first within a rank
  for (const d of candidates) {
    const isShell = d.startsWith('chromium_headless_shell-')
    const exe = isShell
      ? join(cache, d, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell')
      : join(cache, d, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium')
    try {
      readdirSync(join(exe, '..')) // cheap existence check on the parent dir
      return exe
    } catch {
      /* keep looking */
    }
  }
  return null
}

const executablePath = findChrome()
if (!executablePath) {
  console.error(
    'No cached Chromium found under ~/Library/Caches/ms-playwright.\n' +
      'Install one with:  npx playwright install chromium\n' +
      'or point CHROME_PATH at an existing Chrome/Chromium binary.',
  )
  process.exit(1)
}

const browser = await chromium.launch({ executablePath })
let failed = 0
for (const [file, query] of shots) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  // IMPORTANT: no deviceScaleFactor here — the driver's canvas already renders
  // at devicePixelRatio. Setting it double-scales and the capture comes out blank.
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(`${BASE}/tools/screenshots/index.html?${query}`, { waitUntil: 'load' })
  await page.waitForFunction('window.__ready === true', { timeout: 15000 })
  await page.waitForTimeout(250) // let the final frame composite
  await page.screenshot({ path: `docs/images/${file}` })
  if (errors.length) {
    console.error(`${file}: ERRORS`, errors)
    failed++
  } else {
    console.log(`${file}: ok`)
  }
  await page.close()
}
await browser.close()
process.exit(failed ? 1 : 0)
