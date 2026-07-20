import { describe, expect, it } from 'vitest'
import { cellKey, rotatedCells } from '../src/core/tile'
import type { TileSpec } from '../src/core/tile'
import { canPlace, createBoard, place } from '../src/core/board'

describe('cellKey', () => {
  it('formats coordinates as "x,y"', () => {
    expect(cellKey(3, 5)).toBe('3,5')
    expect(cellKey(-1, 0)).toBe('-1,0')
  })
})

describe('rotatedCells', () => {
  const straight: TileSpec = {
    id: 't',
    cells: [{ x: 0, y: 0, center: 'field', edges: ['road', 'field', 'road', 'field'] }],
  }

  it('leaves edges unchanged at rotation 0', () => {
    const [c] = rotatedCells(straight, 0)
    expect(c!.edges).toEqual({ n: 'road', e: 'field', s: 'road', w: 'field' })
  })

  it('rotates edges 90° CW (n <- w, e <- n, ...)', () => {
    const [c] = rotatedCells(straight, 1)
    expect(c!.edges).toEqual({ n: 'field', e: 'road', s: 'field', w: 'road' })
  })

  it('returns to original at rotation 4', () => {
    const domino: TileSpec = {
      id: 'd',
      cells: [
        { x: 0, y: 0, center: 'field', edges: ['field', 'road', 'field', 'road'] },
        { x: 1, y: 0, center: 'field', edges: ['field', 'road', 'field', 'road'] },
      ],
    }
    const original = rotatedCells(domino, 0)
    let cells = rotatedCells(domino, 0)
    for (let i = 0; i < 4; i++) {
      cells = cells.map((c) => ({
        ...c,
        x: -c.y,
        y: c.x,
        edges: { n: c.edges.w, e: c.edges.n, s: c.edges.e, w: c.edges.s },
      }))
    }
    expect(cells).toEqual(original)
  })

  it('rotates a horizontal domino to vertical at rotation 1', () => {
    const domino: TileSpec = {
      id: 'd',
      cells: [
        { x: 0, y: 0, center: 'field', edges: ['field', 'road', 'field', 'road'] },
        { x: 1, y: 0, center: 'field', edges: ['field', 'road', 'field', 'road'] },
      ],
    }
    const rotated = rotatedCells(domino, 1)
    const positions = rotated.map((c) => [c.x, c.y]).sort()
    expect(positions).toEqual([[0, 0], [0, 1]])
  })
})

describe('canPlace', () => {
  const single = (edges: [string, string, string, string]): TileSpec => ({
    id: 's',
    cells: [{ x: 0, y: 0, center: 'field', edges: edges as never }],
  })

  it('allows first placement anywhere', () => {
    const board = createBoard()
    const cells = rotatedCells(single(['road', 'road', 'road', 'road']), 0)
    expect(canPlace(board, cells, 5, 5).ok).toBe(true)
  })

  it('rejects overlap', () => {
    const board = createBoard()
    const cells = rotatedCells(single(['field', 'field', 'field', 'field']), 0)
    place(board, cells, 0, 0)
    expect(canPlace(board, cells, 0, 0)).toEqual({ ok: false, reason: 'overlap' })
  })

  it('rejects placement with no contact', () => {
    const board = createBoard()
    const cells = rotatedCells(single(['field', 'field', 'field', 'field']), 0)
    place(board, cells, 0, 0)
    expect(canPlace(board, cells, 5, 5)).toEqual({ ok: false, reason: 'no-contact' })
  })

  it('rejects edge mismatch', () => {
    const board = createBoard()
    place(board, rotatedCells(single(['field', 'road', 'field', 'field']), 0), 0, 0)
    const bad = rotatedCells(single(['field', 'field', 'field', 'field']), 0)
    expect(canPlace(board, bad, 1, 0)).toEqual({ ok: false, reason: 'edge-mismatch' })
  })

  it('accepts matching edges when adjacent', () => {
    const board = createBoard()
    place(board, rotatedCells(single(['field', 'road', 'field', 'field']), 0), 0, 0)
    const good = rotatedCells(single(['field', 'field', 'field', 'road']), 0)
    expect(canPlace(board, good, 1, 0).ok).toBe(true)
  })
})
