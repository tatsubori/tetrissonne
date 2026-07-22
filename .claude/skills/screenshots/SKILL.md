---
name: screenshots
description: Capture Tetrissonne gameplay stills (for the README and docs) by autoplaying a deterministic game and driving a headless browser against the real render code.
---

# Capturing gameplay screenshots

Produces PNGs of the actual game — not mockups. A driver page autoplays a
deterministic game using the real `src/core` + `src/render` code, paints one
frame to a canvas, and a headless Chromium screenshots it.

Output lands in `docs/images/`. The README embeds `mid-game.png` and
`game-over.png`.

## Files

- `tools/screenshots/driver.ts` — autoplays a seeded game and renders one final
  frame. Behaviour is set by URL query params (see below). Sets
  `window.__ready = true` when the frame is painted.
- `tools/screenshots/index.html` — loads the driver (served by Vite).
- `tools/screenshots/capture.mjs` — launches headless Chromium, waits for
  `__ready`, writes one PNG per entry in its `shots` table.

## Run it

```bash
npm install                 # first time — pulls playwright-core
npm run dev &               # Vite on :5173
# wait for the server to actually serve, don't sleep-guess:
until curl -sf http://localhost:5173/ >/dev/null; do sleep 0.5; done
npm run screenshots         # writes docs/images/*.png
lsof -ti:5173 -sTCP:LISTEN | xargs kill   # stop the dev server when done
```

`npm run screenshots` = `node tools/screenshots/capture.mjs`. It exits non-zero
if any page threw. Verify the results by opening the PNGs — a blank/white image
is a failure even when the script prints `ok`.

## Driver query params (per shot)

| param     | default        | meaning                                                        |
|-----------|----------------|----------------------------------------------------------------|
| `seed`    | `12345`        | PRNG seed for the shuffled bag + placement jitter (replayable) |
| `turns`   | `9999`         | stop after N turns (`9999` ≈ play until the bag/space runs out)|
| `state`   | —              | `over` = drain the bag for a scored game-over board            |
| `meeples` | `0.7`          | probability of claiming a feature each turn (0..1)             |
| `w`,`h`   | window size    | canvas size in CSS px                                          |

Edit the `shots` table at the top of `capture.mjs` to add/retune stills, e.g.
`['mid-game.png', 'seed=7&turns=14&meeples=0.7&w=1280&h=900']`. The bag is only
~18 tiles, so a game runs out around turn 18 — `turns` in the low teens gives an
active mid-game; `state=over` gives the final scored board.

## Browser resolution

`playwright-core` ships no browser. `capture.mjs` auto-detects a Chromium that
Playwright has already cached under `~/Library/Caches/ms-playwright`
(prefers the lighter `chrome-headless-shell`). If none is cached:

```bash
npx playwright install chromium
# or point at any Chrome/Chromium you already have:
CHROME_PATH=/path/to/chrome npm run screenshots
```

Override the dev-server URL with `CAPTURE_BASE_URL` if not on `:5173`.

## Gotchas (learned the hard way)

- **Do NOT set `deviceScaleFactor` on the Playwright page.** The driver's canvas
  already renders at `devicePixelRatio`; adding page-level scaling double-scales
  the backing store and the screenshot comes out **blank white** even though the
  script reports success. Keep the page at scale 1 and let the canvas own DPR.
- **Wait for `__ready`, then a short settle** (`waitForTimeout(250)`) so the
  final frame composites before the screenshot.
- **Poll the dev server**, don't `sleep` — Vite compiles the TS entry on first
  request and the first `goto` can be slow.
- **Always eyeball the PNG.** `pageerror` catches thrown exceptions, but a canvas
  that painted nothing still "succeeds."
