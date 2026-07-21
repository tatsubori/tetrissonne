import { cellKey, sideDelta, SIDES } from './tile'
import type { EdgeSide, PlacedCell } from './tile'

export interface Board {
  cells: Map<string, PlacedCell>
}

export function createBoard(): Board {
  return { cells: new Map() }
}

interface Neighbor {
  dx: number
  dy: number
  myEdge: EdgeSide
  theirEdge: EdgeSide
}

const NEIGHBORS: Neighbor[] = SIDES.map((s) => {
  const { dx, dy } = sideDelta(s)
  const opp: EdgeSide = s === 'n' ? 's' : s === 's' ? 'n' : s === 'e' ? 'w' : 'e'
  return { dx, dy, myEdge: s, theirEdge: opp }
})

export interface PlacementResult {
  ok: boolean
  reason?: 'overlap' | 'no-contact' | 'edge-mismatch'
}

export function canPlace(
  board: Board,
  cells: PlacedCell[],
  ax: number,
  ay: number,
): PlacementResult {
  const occupied = new Set<string>()
  for (const c of cells) {
    const gx = ax + c.x
    const gy = ay + c.y
    const k = cellKey(gx, gy)
    if (board.cells.has(k)) return { ok: false, reason: 'overlap' }
    occupied.add(k)
  }

  if (board.cells.size === 0) return { ok: true }

  let touches = false
  for (const c of cells) {
    const gx = ax + c.x
    const gy = ay + c.y
    for (const n of NEIGHBORS) {
      const nk = cellKey(gx + n.dx, gy + n.dy)
      if (occupied.has(nk)) continue
      const existing = board.cells.get(nk)
      if (!existing) continue
      touches = true
      if (existing.edges[n.theirEdge] !== c.edges[n.myEdge]) {
        return { ok: false, reason: 'edge-mismatch' }
      }
    }
  }
  return touches ? { ok: true } : { ok: false, reason: 'no-contact' }
}

export function place(
  board: Board,
  cells: PlacedCell[],
  ax: number,
  ay: number,
): PlacedCell[] {
  const out: PlacedCell[] = []
  for (const c of cells) {
    const gx = ax + c.x
    const gy = ay + c.y
    const placed: PlacedCell = { ...c, x: gx, y: gy }
    board.cells.set(cellKey(gx, gy), placed)
    out.push(placed)
  }
  return out
}
