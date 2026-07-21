import { describe, it, expect } from 'vitest'
import { createBoard, place } from '../src/core/board'
import { rotatedCells } from '../src/core/tile'
import type { TileSpec } from '../src/core/tile'
import { tryPlace, tryPlaceMeeple, placeableAnchors, newGame } from '../src/core/game'
import type { Game } from '../src/core/game'

const F = 'field'
const R = 'road'
const C = 'city'

const straightRoad: TileSpec = { id: 'sr', cells: [{ x: 0, y: 0, center: F, edges: [R, F, R, F] }] }
const citySide: TileSpec = { id: 'cs', cells: [{ x: 0, y: 0, center: C, edges: [C, F, F, F] }] }
const fieldTile: TileSpec = { id: 'ft', cells: [{ x: 0, y: 0, center: F, edges: [F, F, F, F] }] }

function gameWith(board: ReturnType<typeof createBoard>, meeples: Game['meeples'], lastPlaced: string[]): Game {
  return {
    board,
    bag: { remaining: [] },
    current: null,
    rotation: 0,
    placed: 0,
    players: [
      { name: 'P1', score: 0, meeples: 7 },
      { name: 'P2', score: 0, meeples: 7 },
    ],
    turn: 1,
    phase: 'place-meeple',
    meeples,
    lastPlaced: new Set(lastPlaced),
    log: [],
  }
}

describe('meeple occupancy across a shared segment', () => {
  it('rejects a meeple on a road already occupied via connection', () => {
    const board = createBoard()
    place(board, rotatedCells(straightRoad, 0), 0, 0)
    place(board, rotatedCells(straightRoad, 0), 0, 1) // connects to the first

    // P1 already owns the road via (0,0); P2 just placed (0,1) and tries to claim it.
    const game = gameWith(board, [{ owner: 0, anchor: { x: 0, y: 0, feature: 'road', side: 'n' } }], ['0,1'])

    expect(placeableAnchors(game).some((a) => a.feature === 'road')).toBe(false)
    expect(tryPlaceMeeple(game, { x: 0, y: 1, feature: 'road', side: 's' })).toBe(false)
  })

  it('rejects a meeple on a city already occupied via connection', () => {
    const board = createBoard()
    place(board, rotatedCells(citySide, 0), 0, 0) // city on N
    place(board, rotatedCells(citySide, 2), 0, -1) // city on S -> connects to first
    const game = gameWith(board, [{ owner: 0, anchor: { x: 0, y: 0, feature: 'city', side: 'n' } }], ['0,-1'])
    expect(placeableAnchors(game).some((a) => a.feature === 'city')).toBe(false)
    expect(tryPlaceMeeple(game, { x: 0, y: -1, feature: 'city', side: 's' })).toBe(false)
  })

  it('rejects a meeple on a field already occupied via connection', () => {
    const board = createBoard()
    place(board, rotatedCells(fieldTile, 0), 0, 0)
    place(board, rotatedCells(fieldTile, 0), 1, 0) // field connects across the shared edge
    const game = gameWith(board, [{ owner: 0, anchor: { x: 0, y: 0, feature: 'field', side: 'w' } }], ['1,0'])
    expect(placeableAnchors(game).some((a) => a.feature === 'field')).toBe(false)
    expect(tryPlaceMeeple(game, { x: 1, y: 0, feature: 'field', side: 'e' })).toBe(false)
  })

  it('rejects via the real place-tile -> place-meeple flow', () => {
    const game = newGame(1, 2)
    // Controlled board: P0 owns a road at (0,0); P1 will extend it at (0,1).
    game.board = createBoard()
    place(game.board, rotatedCells(straightRoad, 0), 0, 0)
    game.meeples = [{ owner: 0, anchor: { x: 0, y: 0, feature: 'road', side: 's' } }]
    game.players = [
      { name: 'P1', score: 0, meeples: 6 },
      { name: 'P2', score: 0, meeples: 7 },
    ]
    game.turn = 1
    game.phase = 'place-tile'
    game.current = straightRoad
    game.bag.remaining = [fieldTile] // something for P1's resolve to draw

    expect(tryPlace(game, 0, 1)).toBe(true)
    // P1 is now in the meeple phase (fields are free) but must not claim the road.
    expect(tryPlaceMeeple(game, { x: 0, y: 1, feature: 'road', side: 'n' })).toBe(false)
  })
})
