import { createBoard, canPlace, place } from './board'
import type { Board } from './board'
import { makeBag, draw, peek } from './bag'
import type { Bag } from './bag'
import { rotatedCells, cellKey, SIDES } from './tile'
import type { Rotation, TileSpec, EdgeSide } from './tile'
import { CATALOG, STARTER_TILE } from './tiles'
import {
  computeSegments,
  anchorNodeKey,
  completedScore,
  endgameScore,
} from './segments'
import type { Segments, Segment } from './segments'

export const MEEPLES_PER_PLAYER = 7
const DEFAULT_PLAYERS = 2

export type Phase = 'place-tile' | 'place-meeple' | 'game-over'
export type FeatureKind = 'road' | 'city' | 'field' | 'monastery'

export interface Anchor {
  x: number
  y: number
  feature: FeatureKind
  side?: EdgeSide
}

export interface Meeple {
  owner: number
  anchor: Anchor
}

export interface Player {
  name: string
  score: number
  meeples: number
}

export interface Game {
  board: Board
  bag: Bag
  current: TileSpec | null
  rotation: Rotation
  placed: number
  players: Player[]
  turn: number
  phase: Phase
  meeples: Meeple[]
  lastPlaced: Set<string>
  log: string[]
}

export function newGame(seed: number, numPlayers: number = DEFAULT_PLAYERS): Game {
  const board = createBoard()
  place(board, rotatedCells(STARTER_TILE, 0), 0, 0)
  const bag = makeBag(CATALOG, seed)
  const players: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
    name: `P${i + 1}`,
    score: 0,
    meeples: MEEPLES_PER_PLAYER,
  }))
  return {
    board,
    bag,
    current: draw(bag),
    rotation: 0,
    placed: 1,
    players,
    turn: 0,
    phase: 'place-tile',
    meeples: [],
    lastPlaced: new Set(),
    log: [],
  }
}

export function rotate(game: Game, delta: 1 | -1): void {
  if (game.phase !== 'place-tile') return
  game.rotation = ((game.rotation + delta + 4) % 4) as Rotation
}

export function currentPlayer(game: Game): Player {
  return game.players[game.turn]!
}

// ---- Tile placement -------------------------------------------------------

export function tryPlace(game: Game, gx: number, gy: number): boolean {
  if (game.phase !== 'place-tile' || !game.current) return false
  const cells = rotatedCells(game.current, game.rotation)
  if (!canPlace(game.board, cells, gx, gy).ok) return false

  const placedCells = place(game.board, cells, gx, gy)
  game.placed += 1
  game.lastPlaced = new Set(placedCells.map((c) => cellKey(c.x, c.y)))
  game.phase = 'place-meeple'

  // Skip the meeple sub-phase when the player can't (or has nowhere to) act.
  if (currentPlayer(game).meeples <= 0 || placeableAnchors(game).length === 0) {
    resolveTurn(game)
  }
  return true
}

// ---- Meeple placement -----------------------------------------------------

function segIndexOfMeeple(segs: Segments, m: Meeple): number {
  if (m.anchor.feature === 'monastery' || !m.anchor.side) return -1
  return segs.byNode.get(anchorNodeKey(m.anchor.x, m.anchor.y, m.anchor.side)) ?? -1
}

// Features on the just-placed tile that the current player could claim: the
// connected feature must not already hold a meeple (Carcassonne's core rule).
export function placeableAnchors(game: Game): Anchor[] {
  if (game.phase !== 'place-meeple') return []
  const segs = computeSegments(game.board)

  const claimed = new Set<number>()
  const claimedMonastery = new Set<string>()
  for (const m of game.meeples) {
    if (m.anchor.feature === 'monastery') claimedMonastery.add(cellKey(m.anchor.x, m.anchor.y))
    else claimed.add(segIndexOfMeeple(segs, m))
  }

  const anchors: Anchor[] = []
  const seen = new Set<number>()
  for (const key of game.lastPlaced) {
    const cell = game.board.cells.get(key)
    if (!cell) continue
    if (cell.center === 'monastery' && !claimedMonastery.has(key)) {
      anchors.push({ x: cell.x, y: cell.y, feature: 'monastery' })
    }
    for (const side of SIDES) {
      const kind = cell.edges[side]
      const idx = segs.byNode.get(anchorNodeKey(cell.x, cell.y, side))
      if (idx == null || claimed.has(idx) || seen.has(idx)) continue
      seen.add(idx)
      anchors.push({ x: cell.x, y: cell.y, feature: kind, side })
    }
  }
  return anchors
}

export function tryPlaceMeeple(game: Game, anchor: Anchor): boolean {
  if (game.phase !== 'place-meeple') return false
  const player = currentPlayer(game)
  if (player.meeples <= 0) return false
  if (!game.lastPlaced.has(cellKey(anchor.x, anchor.y))) return false

  const cell = game.board.cells.get(cellKey(anchor.x, anchor.y))
  if (!cell) return false

  const segs = computeSegments(game.board)
  if (anchor.feature === 'monastery') {
    if (cell.center !== 'monastery') return false
    if (game.meeples.some((m) => m.anchor.feature === 'monastery' && m.anchor.x === anchor.x && m.anchor.y === anchor.y)) {
      return false
    }
  } else {
    if (!anchor.side || cell.edges[anchor.side] !== anchor.feature) return false
    const idx = segs.byNode.get(anchorNodeKey(anchor.x, anchor.y, anchor.side))
    if (idx == null) return false
    if (game.meeples.some((m) => segIndexOfMeeple(segs, m) === idx)) return false
  }

  game.meeples.push({ owner: game.turn, anchor })
  player.meeples -= 1
  resolveTurn(game)
  return true
}

export function skipMeeple(game: Game): void {
  if (game.phase !== 'place-meeple') return
  resolveTurn(game)
}

// ---- Turn resolution + scoring -------------------------------------------

function logLine(game: Game, line: string): void {
  game.log.push(line)
  if (game.log.length > 6) game.log.shift()
}

// Award `points` to the majority owner(s) of a feature, then return every
// meeple on it to its owner's supply.
function scoreFeature(game: Game, on: Meeple[], points: number, label: string): void {
  const counts = new Map<number, number>()
  for (const m of on) counts.set(m.owner, (counts.get(m.owner) ?? 0) + 1)
  const max = Math.max(...counts.values())
  for (const [owner, n] of counts) {
    if (n === max && points > 0) {
      game.players[owner]!.score += points
      logLine(game, `${game.players[owner]!.name} +${points} (${label})`)
    }
  }
  for (const m of on) game.players[m.owner]!.meeples += 1
  game.meeples = game.meeples.filter((m) => !on.includes(m))
}

// Score every completed road/city/monastery that currently holds a meeple, and
// return those meeples. Features completed on earlier turns no longer hold
// meeples (they were returned then), so they aren't double-counted.
function scoreCompleted(game: Game): void {
  const segs = computeSegments(game.board)

  const byIndex = new Map<number, Meeple[]>()
  for (const m of game.meeples) {
    const idx = segIndexOfMeeple(segs, m)
    if (idx < 0) continue
    ;(byIndex.get(idx) ?? byIndex.set(idx, []).get(idx)!).push(m)
  }
  for (const [idx, on] of byIndex) {
    const seg = segs.list[idx]!
    if (seg.kind === 'field' || !seg.complete) continue
    scoreFeature(game, on, completedScore(seg), seg.kind)
  }

  for (const mon of segs.monasteries) {
    if (!mon.complete) continue
    const on = game.meeples.filter(
      (m) => m.anchor.feature === 'monastery' && m.anchor.x === mon.x && m.anchor.y === mon.y,
    )
    if (on.length) scoreFeature(game, on, mon.tiles, 'monastery')
  }
}

function resolveTurn(game: Game): void {
  scoreCompleted(game)
  game.current = draw(game.bag)
  game.rotation = 0
  game.lastPlaced = new Set()

  if (!game.current) {
    endGameScoring(game)
    game.phase = 'game-over'
  } else {
    game.turn = (game.turn + 1) % game.players.length
    game.phase = 'place-tile'
  }
}

// Distinct completed cities that a farm borders (within-cell adjacency — a
// simplified model of Carcassonne farms, see fieldGroups in features.ts).
function farmBorderCities(game: Game, segs: Segments, farm: Segment): Set<number> {
  const cities = new Set<number>()
  for (const coord of farm.cells) {
    const cell = game.board.cells.get(coord)
    if (!cell) continue
    for (const side of SIDES) {
      if (cell.edges[side] !== 'city') continue
      const idx = segs.byNode.get(anchorNodeKey(cell.x, cell.y, side))
      if (idx != null && segs.list[idx]!.complete) cities.add(idx)
    }
  }
  return cities
}

function endGameScoring(game: Game): void {
  const segs = computeSegments(game.board)

  const byIndex = new Map<number, Meeple[]>()
  for (const m of game.meeples) {
    const idx = segIndexOfMeeple(segs, m)
    if (idx < 0) continue
    ;(byIndex.get(idx) ?? byIndex.set(idx, []).get(idx)!).push(m)
  }
  for (const [idx, on] of byIndex) {
    const seg = segs.list[idx]!
    if (seg.kind === 'field') {
      const points = farmBorderCities(game, segs, seg).size * 3
      scoreFeature(game, on, points, 'farm')
    } else {
      scoreFeature(game, on, endgameScore(seg), seg.kind)
    }
  }

  for (const mon of segs.monasteries) {
    const on = game.meeples.filter(
      (m) => m.anchor.feature === 'monastery' && m.anchor.x === mon.x && m.anchor.y === mon.y,
    )
    if (on.length) scoreFeature(game, on, mon.tiles, 'monastery')
  }
}

export function winners(game: Game): number[] {
  const max = Math.max(...game.players.map((p) => p.score))
  return game.players.map((_, i) => i).filter((i) => game.players[i]!.score === max)
}

// ---- Views ----------------------------------------------------------------

export function currentPreview(game: Game) {
  if (!game.current) return null
  return rotatedCells(game.current, game.rotation)
}

export function upcoming(game: Game, n: number): TileSpec[] {
  return peek(game.bag, n)
}
