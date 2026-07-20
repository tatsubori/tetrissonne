import { cellKey } from './tile'
import type { PlacedCell } from './tile'

export interface Board {
  cells: Map<string, PlacedCell>
}

export function createBoard(): Board {
  return { cells: new Map() }
}

interface Neighbor {
  dx: number
  dy: number
  myEdge: 'n' | 'e' | 's' | 'w'
  theirEdge: 'n' | 'e' | 's' | 'w'
}

const NEIGHBORS: Neighbor[] = [
  { dx: 0, dy: -1, myEdge: 'n', theirEdge: 's' },
  { dx: 1, dy: 0, myEdge: 'e', theirEdge: 'w' },
  { dx: 0, dy: 1, myEdge: 's', theirEdge: 'n' },
  { dx: -1, dy: 0, myEdge: 'w', theirEdge: 'e' },
]

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
): void {
  for (const c of cells) {
    const gx = ax + c.x
    const gy = ay + c.y
    board.cells.set(cellKey(gx, gy), { ...c, x: gx, y: gy })
  }
}
