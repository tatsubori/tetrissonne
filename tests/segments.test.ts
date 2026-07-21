import { describe, it, expect } from 'vitest'
import { createBoard, place } from '../src/core/board'
import { computeSegments, completedScore, endgameScore } from '../src/core/segments'
import { rotatedCells } from '../src/core/tile'
import type { Rotation, TileSpec } from '../src/core/tile'

const F = 'field'
const R = 'road'
const C = 'city'

function put(board: ReturnType<typeof createBoard>, tile: TileSpec, x: number, y: number, rot: Rotation = 0) {
  place(board, rotatedCells(tile, rot), x, y)
}

const straightRoad: TileSpec = { id: 'sr', cells: [{ x: 0, y: 0, center: F, edges: [R, F, R, F] }] }
const closedCity: TileSpec = { id: 'cc', cells: [{ x: 0, y: 0, center: C, edges: [C, C, C, C] }] }
const citySide: TileSpec = { id: 'cs', cells: [{ x: 0, y: 0, center: C, edges: [C, F, F, F] }] }
const monastery: TileSpec = { id: 'mon', cells: [{ x: 0, y: 0, center: 'monastery', edges: [F, F, F, F] }] }
const tRoad: TileSpec = { id: 't', cells: [{ x: 0, y: 0, center: F, edges: [R, R, R, F] }] } // N,E,S
// A church with roads on N and S: the church terminates the roads meeting it.
const churchThrough: TileSpec = { id: 'ct', cells: [{ x: 0, y: 0, center: 'monastery', edges: [R, F, R, F] }] }
// A church that caps one road end (road on S at rot 0).
const churchCap: TileSpec = { id: 'cap', cells: [{ x: 0, y: 0, center: 'monastery', edges: [F, F, R, F] }] }

describe('road segments', () => {
  it('a village junction (3+ roads) terminates the roads — each arm is its own road', () => {
    const board = createBoard()
    put(board, tRoad, 0, 0) // N, E, S
    const roads = computeSegments(board).list.filter((s) => s.kind === 'road')
    expect(roads.length).toBe(3)
  })

  it('a church terminates the roads meeting it (splits them)', () => {
    const board = createBoard()
    put(board, churchThrough, 0, 0)
    const roads = computeSegments(board).list.filter((s) => s.kind === 'road')
    expect(roads.length).toBe(2)
  })

  it('a road capped at both ends by churches is complete and scores per tile', () => {
    const board = createBoard()
    put(board, straightRoad, 0, 0)
    put(board, straightRoad, 0, 1)
    const open = computeSegments(board).list.find((s) => s.kind === 'road')!
    expect(open.cells.size).toBe(2)
    expect(open.complete).toBe(false)

    put(board, churchCap, 0, -1) // church above, road on S caps the top
    put(board, churchCap, 0, 2, 2) // church below (rot 180 -> road on N), caps the bottom
    const road = computeSegments(board).list.find((s) => s.kind === 'road' && s.complete)!
    expect(road.cells.size).toBe(4)
    expect(completedScore(road)).toBe(4)
  })
})

describe('city segments', () => {
  it('a single city tile with open walls is incomplete (no neighbours)', () => {
    const board = createBoard()
    put(board, closedCity, 0, 0)
    const city = computeSegments(board).list.find((s) => s.kind === 'city')!
    expect(city.complete).toBe(false)
    expect(city.open).toBe(4)
  })

  it('walling a city on all four sides completes it (2/tile)', () => {
    const board = createBoard()
    put(board, closedCity, 0, 0) // city on all sides
    put(board, citySide, 0, 1, 0) // south neighbour, city on N -> faces centre
    put(board, citySide, -1, 0, 1) // west neighbour, city on E
    put(board, citySide, 0, -1, 2) // north neighbour, city on S
    put(board, citySide, 1, 0, 3) // east neighbour, city on W
    const city = computeSegments(board).list.find((s) => s.kind === 'city' && s.complete)!
    expect(city.cells.size).toBe(5)
    expect(completedScore(city)).toBe(10)
  })

  it('two facing city_side tiles close into a 2-tile city', () => {
    const board = createBoard()
    put(board, citySide, 0, 0)
    put(board, citySide, 0, -1, 2)
    const city = computeSegments(board).list.find((s) => s.kind === 'city')!
    expect(city.cells.size).toBe(2)
    expect(city.complete).toBe(true)
    expect(completedScore(city)).toBe(4)
  })

  it('an open city is incomplete and scores 1/tile at game end', () => {
    const board = createBoard()
    put(board, citySide, 0, 0)
    const city = computeSegments(board).list.find((s) => s.kind === 'city')!
    expect(city.complete).toBe(false)
    expect(endgameScore(city)).toBe(1)
  })
})

describe('monasteries', () => {
  it('completes only when all 8 neighbours are present (worth 9)', () => {
    const board = createBoard()
    put(board, monastery, 0, 0)
    expect(computeSegments(board).monasteries[0]!.complete).toBe(false)
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        put(board, straightRoad, dx, dy)
      }
    }
    const mon = computeSegments(board).monasteries[0]!
    expect(mon.complete).toBe(true)
    expect(mon.tiles).toBe(9)
  })
})
