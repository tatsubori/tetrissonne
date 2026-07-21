import { describe, it, expect } from 'vitest'
import { canPlace } from '../src/core/board'
import { computeSegments } from '../src/core/segments'
import { rotatedCells, SIDES } from '../src/core/tile'
import type { Rotation } from '../src/core/tile'
import { newGame, tryPlace, tryPlaceMeeple, currentPlayer } from '../src/core/game'
import type { Anchor, Game } from '../src/core/game'

// Is the feature at `anchor` already occupied by a meeple *right now*? Placing
// onto an occupied feature is illegal; ending up with two meeples on one feature
// later (because a tile connected two separately-claimed features) is legal.
function isOccupied(game: Game, anchor: Anchor): boolean {
  if (anchor.feature === 'monastery') {
    return game.meeples.some(
      (m) => m.anchor.feature === 'monastery' && m.anchor.x === anchor.x && m.anchor.y === anchor.y,
    )
  }
  if (!anchor.side) return false
  const segs = computeSegments(game.board)
  const idx = segs.byNode.get(`${anchor.x},${anchor.y}:${anchor.side}`)
  if (idx == null) return false
  return game.meeples.some(
    (m) => m.anchor.side != null && segs.byNode.get(`${m.anchor.x},${m.anchor.y}:${m.anchor.side}`) === idx,
  )
}

function findPlacement(game: Game): { gx: number; gy: number; rot: Rotation } | null {
  if (!game.current) return null
  for (let rot = 0 as Rotation; rot < 4; rot = (rot + 1) as Rotation) {
    const cells = rotatedCells(game.current, rot)
    for (let gy = -12; gy <= 12; gy++) {
      for (let gx = -12; gx <= 12; gx++) {
        if (canPlace(game.board, cells, gx, gy).ok) return { gx, gy, rot }
      }
    }
  }
  return null
}

// Enumerate every feature a click could resolve to on the just-placed tile.
function allAnchors(game: Game): Anchor[] {
  const out: Anchor[] = []
  for (const key of game.lastPlaced) {
    const cell = game.board.cells.get(key)
    if (!cell) continue
    if (cell.center === 'monastery') out.push({ x: cell.x, y: cell.y, feature: 'monastery' })
    for (const side of SIDES) out.push({ x: cell.x, y: cell.y, feature: cell.edges[side], side })
  }
  return out
}

describe('meeple placement never double-claims a segment (fuzz over full games)', () => {
  it('holds the invariant when clicking every feature of every placed tile', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const game = newGame(seed, 2)
      let guard = 0
      while (game.phase !== 'game-over' && guard++ < 500) {
        const spot = findPlacement(game)
        if (!spot) break
        game.rotation = spot.rot
        expect(tryPlace(game, spot.gx, spot.gy)).toBe(true)

        if (game.phase === 'place-meeple' && currentPlayer(game).meeples > 0) {
          // Attempt a meeple on every feature (mimics the user clicking anywhere).
          // The rule: a placement must be REJECTED if that feature is already occupied.
          for (const a of allAnchors(game)) {
            if (game.phase !== 'place-meeple') break
            const occupied = isOccupied(game, a)
            const ok = tryPlaceMeeple(game, a)
            if (ok && occupied) {
              throw new Error(
                `seed ${seed}: placed a meeple on an already-occupied ${a.feature} at ${a.x},${a.y}:${a.side}`,
              )
            }
          }
          if (game.phase === 'place-meeple') tryPlaceMeeple(game, { x: 1e9, y: 1e9, feature: 'field', side: 'n' })
        }
      }
    }
  })
})
