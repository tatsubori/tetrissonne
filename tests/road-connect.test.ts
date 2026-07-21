import { describe, it, expect } from 'vitest'
import { createBoard, place } from '../src/core/board'
import { computeSegments } from '../src/core/segments'
import { rotatedCells } from '../src/core/tile'
import type { TileSpec } from '../src/core/tile'
import { tryPlaceMeeple } from '../src/core/game'
import type { Game } from '../src/core/game'

const F = 'field'
const R = 'road'

const straightRoad: TileSpec = { id: 'sr', cells: [{ x: 0, y: 0, center: F, edges: [R, F, R, F] }] }
const crossroads: TileSpec = { id: 'x', cells: [{ x: 0, y: 0, center: F, edges: [R, R, R, R] }] }
// A T-junction: road on N, E, S (like the tile in the reported screenshot).
const tRoad: TileSpec = { id: 't', cells: [{ x: 0, y: 0, center: F, edges: [R, R, R, F] }] }

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

describe('road connecting to an occupied road', () => {
  it('straight extension is ONE road → blocked', () => {
    const board = createBoard()
    place(board, rotatedCells(straightRoad, 0), 0, 0) // road N-S
    place(board, rotatedCells(straightRoad, 0), 0, 1) // road N-S, extends it
    const game = gameWith(board, [{ owner: 0, anchor: { x: 0, y: 0, feature: 'road', side: 'n' } }], ['0,1'])
    expect(tryPlaceMeeple(game, { x: 0, y: 1, feature: 'road', side: 's' })).toBe(false)
  })

  it('a village junction terminates the roads: arms are separate segments', () => {
    const board = createBoard()
    place(board, rotatedCells(straightRoad, 0), 0, 0) // road N-S at (0,0)
    place(board, rotatedCells(crossroads, 0), 0, 1) // 4-way junction (village) just below

    const segs = computeSegments(board)
    const segOf = (x: number, y: number, side: string) => segs.byNode.get(`${x},${y}:${side}`)
    // The arm meeting the road above is the same road; the junction's other arms
    // are terminated by the village into distinct roads.
    expect(segOf(0, 1, 'n')).toBe(segOf(0, 0, 's'))
    expect(segOf(0, 1, 'e')).not.toBe(segOf(0, 0, 's'))
    expect(segOf(0, 1, 'w')).not.toBe(segOf(0, 0, 's'))
  })

  it('only the road physically continuing into an occupied one is blocked', () => {
    const board = createBoard()
    place(board, rotatedCells(straightRoad, 0), 0, 0)
    place(board, rotatedCells(crossroads, 0), 0, 1)
    const game = gameWith(board, [{ owner: 0, anchor: { x: 0, y: 0, feature: 'road', side: 'n' } }], ['0,1'])
    // North arm continues the occupied road → blocked.
    expect(tryPlaceMeeple(game, { x: 0, y: 1, feature: 'road', side: 'n' })).toBe(false)
    // Other arms are separate roads terminated by the village → claimable.
    expect(tryPlaceMeeple(game, { x: 0, y: 1, feature: 'road', side: 'e' })).toBe(true)
  })

  it('a village terminator separates a claimed arm from the arm a neighbour connects to', () => {
    const board = createBoard()
    place(board, rotatedCells(tRoad, 0), 0, 0) // village junction: N, E, S — red claims the north arm
    place(board, rotatedCells(straightRoad, 0), 0, 1) // blue connects to the south arm below
    const game = gameWith(board, [{ owner: 0, anchor: { x: 0, y: 0, feature: 'road', side: 'n' } }], ['0,1'])
    // South arm is a different road (village between it and red's north arm) → allowed.
    expect(tryPlaceMeeple(game, { x: 0, y: 1, feature: 'road', side: 's' })).toBe(true)
  })
})
