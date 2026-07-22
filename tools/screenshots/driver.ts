// Screenshot driver — plays a deterministic game and renders a single still so
// we can capture marketing/README images that reuse the real game + render code.
//
// It is loaded by tools/screenshots/index.html (served by the Vite dev server)
// and driven headlessly by tools/screenshots/capture.mjs. Behaviour is controlled
// entirely by URL query params so one page serves every shot:
//
//   seed    PRNG seed for the shuffled bag + placement jitter (default 12345)
//   turns   stop after N turns (default 9999 = play until the bag/space runs out)
//   state   "over" = drain the rest of the bag for a scored game-over board
//   meeples probability of claiming a feature each turn, 0..1 (default 0.7)
//   w, h    canvas size in CSS px (default window inner size)
//
// It sets window.__ready = true once the final frame is painted; the capture
// script waits on that before taking the screenshot.
import {
  newGame,
  tryPlace,
  tryPlaceMeeple,
  skipMeeple,
  placeableAnchors,
  upcoming,
} from '../../src/core/game'
import type { Game, FeatureKind } from '../../src/core/game'
import { canPlace } from '../../src/core/board'
import { rotatedCells } from '../../src/core/tile'
import type { Rotation } from '../../src/core/tile'
import { drawBoard } from '../../src/render/board'
import { drawHUD } from '../../src/render/hud'
import type { Camera } from '../../src/render/grid'
import { CELL_SIZE, HUD_WIDTH } from '../../src/render/theme'

const params = new URLSearchParams(location.search)
const seed = Number(params.get('seed') ?? '12345')
const maxTurns = Number(params.get('turns') ?? '9999')
const finish = params.get('state') === 'over'
const meepleRate = Number(params.get('meeples') ?? '0.7')
const W = Number(params.get('w') ?? String(window.innerWidth))
const H = Number(params.get('h') ?? String(window.innerHeight))

const canvas = document.getElementById('game') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
// Render at devicePixelRatio for crisp text/edges. NOTE: do NOT also set
// deviceScaleFactor on the Playwright page — it double-scales the backing store
// and the capture comes out blank. Let the canvas own the DPR; keep the page at 1.
const dpr = Math.min(window.devicePixelRatio || 1, 2)
canvas.width = Math.round(W * dpr)
canvas.height = Math.round(H * dpr)
canvas.style.width = W + 'px'
canvas.style.height = H + 'px'
ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

const game = newGame(seed)

// Deterministic PRNG so choices vary but replay identically per seed.
let rngState = (seed ^ 0x9e3779b9) >>> 0
function rng(): number {
  rngState = (rngState * 1664525 + 1013904223) >>> 0
  return rngState / 0xffffffff
}

// Empty cells adjacent to an occupied cell — the only spots worth trying.
function candidates(): Array<{ gx: number; gy: number }> {
  const seen = new Set<string>()
  const out: Array<{ gx: number; gy: number }> = []
  for (const cell of game.board.cells.values()) {
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const gx = cell.x + dx
      const gy = cell.y + dy
      const k = `${gx},${gy}`
      if (game.board.cells.has(k) || seen.has(k)) continue
      seen.add(k)
      out.push({ gx, gy })
    }
  }
  return out
}

const FEATURE_PREF: Record<FeatureKind, number> = { city: 3, monastery: 2, road: 1, field: 0 }

function playTurn(): boolean {
  if (!game.current) return false
  // Find every legal placement, prefer ones that keep the map compact.
  let best: { gx: number; gy: number; r: Rotation; dist: number } | null = null
  for (let r = 0 as Rotation; r < 4; r = (r + 1) as Rotation) {
    const cells = rotatedCells(game.current, r)
    for (const cand of candidates()) {
      if (!canPlace(game.board, cells, cand.gx, cand.gy).ok) continue
      const dist = Math.abs(cand.gx) + Math.abs(cand.gy) + rng() * 2
      if (!best || dist < best.dist) best = { ...cand, r, dist }
    }
  }
  if (!best) return false
  game.rotation = best.r
  if (!tryPlace(game, best.gx, best.gy)) return false

  if ((game as Game).phase === 'place-meeple') {
    const anchors = placeableAnchors(game)
    if (anchors.length && rng() < meepleRate) {
      anchors.sort((a, b) => FEATURE_PREF[b.feature] - FEATURE_PREF[a.feature])
      if (!tryPlaceMeeple(game, anchors[0]!)) skipMeeple(game)
    } else {
      skipMeeple(game)
    }
  }
  return true
}

let turns = 0
while (turns < maxTurns && game.phase !== 'game-over') {
  if (!playTurn()) break
  turns++
}
if (finish) {
  // Drain the rest of the bag for a game-over board with endgame scoring.
  while (game.phase !== 'game-over' && playTurn()) {}
}

// Center the camera on the board's bounding box within the play area.
let minX = Infinity
let minY = Infinity
let maxX = -Infinity
let maxY = -Infinity
for (const c of game.board.cells.values()) {
  minX = Math.min(minX, c.x)
  minY = Math.min(minY, c.y)
  maxX = Math.max(maxX, c.x)
  maxY = Math.max(maxY, c.y)
}
const boardW = W - HUD_WIDTH
const spanX = (maxX - minX + 1) * CELL_SIZE
const spanY = (maxY - minY + 1) * CELL_SIZE
const cam: Camera = {
  originX: Math.round(boardW / 2 - spanX / 2 - minX * CELL_SIZE),
  originY: Math.round(H / 2 - spanY / 2 - minY * CELL_SIZE),
  cellSize: CELL_SIZE,
}

drawBoard(ctx, game, cam, null, W, H)
drawHUD(ctx, game, upcoming(game, 3), W, H)

// Signal to the capture harness that rendering is done.
;(window as unknown as { __ready: boolean }).__ready = true
