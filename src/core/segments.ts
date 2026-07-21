import { cellKey, sideDelta, oppositeSide, SIDES } from './tile'
import type { EdgeSide, PlacedCell } from './tile'
import { roadGroups, cityGroups, fieldGroups } from './features'
import type { Board } from './board'

// A linear feature (road / city / field) spanning one or more cells, resolved
// as a connected component of (cell, side) "edge-nodes" via union-find.
export type SegKind = 'road' | 'city' | 'field'

export interface Segment {
  kind: SegKind
  nodes: string[] // edge-node keys, "x,y:side"
  cells: Set<string> // distinct cells the feature covers, "x,y"
  open: number // edge-nodes whose neighbouring cell is still empty
  complete: boolean
}

export interface Monastery {
  x: number
  y: number
  tiles: number // 1 (self) + occupied neighbours (of 8)
  complete: boolean
}

export interface Segments {
  list: Segment[]
  byNode: Map<string, number> // edge-node key -> index into list
  monasteries: Monastery[]
}

function nodeKey(x: number, y: number, s: EdgeSide): string {
  return `${x},${y}:${s}`
}

export function anchorNodeKey(x: number, y: number, s: EdgeSide): string {
  return nodeKey(x, y, s)
}

// Recomputed from scratch whenever needed. The board is small (a polyomino
// puzzle), so a full pass each turn is far simpler than maintaining incremental
// union-find state, and avoids stale segment ids across placements.
export function computeSegments(board: Board): Segments {
  const parent = new Map<string, string>()
  const kind = new Map<string, SegKind>()

  const ensure = (k: string, kd: SegKind) => {
    if (!parent.has(k)) {
      parent.set(k, k)
      kind.set(k, kd)
    }
  }
  const find = (a: string): string => {
    let r = a
    while (parent.get(r) !== r) r = parent.get(r)!
    // path compression
    let c = a
    while (parent.get(c) !== r) {
      const next = parent.get(c)!
      parent.set(c, r)
      c = next
    }
    return r
  }
  const union = (a: string, b: string) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent.set(ra, rb)
  }

  const groupsFor = (cell: PlacedCell, kd: SegKind): EdgeSide[][] =>
    kd === 'road' ? roadGroups(cell) : kd === 'city' ? cityGroups(cell) : fieldGroups(cell)

  // 1. Within-cell unions: join sides that share an internal feature group.
  for (const cell of board.cells.values()) {
    for (const kd of ['road', 'city', 'field'] as SegKind[]) {
      for (const group of groupsFor(cell, kd)) {
        const keys = group.map((s) => nodeKey(cell.x, cell.y, s))
        keys.forEach((k) => ensure(k, kd))
        for (let i = 1; i < keys.length; i++) union(keys[0]!, keys[i]!)
      }
    }
  }

  // 2. Across-cell unions: matching edges of adjacent cells continue a feature.
  for (const cell of board.cells.values()) {
    for (const s of SIDES) {
      const kd = cell.edges[s] as SegKind
      const { dx, dy } = sideDelta(s)
      const neighbor = board.cells.get(cellKey(cell.x + dx, cell.y + dy))
      if (!neighbor) continue
      const opp = oppositeSide(s)
      if (neighbor.edges[opp] !== cell.edges[s]) continue // guarded (placement matches)
      const a = nodeKey(cell.x, cell.y, s)
      const b = nodeKey(neighbor.x, neighbor.y, opp)
      ensure(a, kd)
      ensure(b, kd)
      union(a, b)
    }
  }

  // 3. Gather connected components.
  const byRoot = new Map<string, Segment>()
  const byNode = new Map<string, number>()
  for (const k of parent.keys()) {
    const root = find(k)
    let seg = byRoot.get(root)
    if (!seg) {
      seg = { kind: kind.get(k)!, nodes: [], cells: new Set(), open: 0, complete: false }
      byRoot.set(root, seg)
    }
    seg.nodes.push(k)
  }

  const list = [...byRoot.values()]
  list.forEach((seg, i) => {
    for (const k of seg.nodes) {
      byNode.set(k, i)
      const [coord, side] = k.split(':') as [string, EdgeSide]
      seg.cells.add(coord)
      const [cx, cy] = coord.split(',').map(Number) as [number, number]
      const { dx, dy } = sideDelta(side)
      if (!board.cells.has(cellKey(cx + dx, cy + dy))) seg.open += 1
    }
    seg.complete = seg.open === 0
  })

  return { list, byNode, monasteries: computeMonasteries(board) }
}

function computeMonasteries(board: Board): Monastery[] {
  const out: Monastery[] = []
  for (const cell of board.cells.values()) {
    if (cell.center !== 'monastery') continue
    let occupied = 0
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        if (board.cells.has(cellKey(cell.x + dx, cell.y + dy))) occupied += 1
      }
    }
    out.push({ x: cell.x, y: cell.y, tiles: 1 + occupied, complete: occupied === 8 })
  }
  return out
}

// Points for a completed segment scored during play.
export function completedScore(seg: Segment): number {
  if (seg.kind === 'road') return seg.cells.size
  if (seg.kind === 'city') return seg.cells.size * 2
  return 0 // fields are never "completed" — scored only at game end
}

// Points for an incomplete road/city counted at game end.
export function endgameScore(seg: Segment): number {
  if (seg.kind === 'road') return seg.cells.size
  if (seg.kind === 'city') return seg.cells.size // 1/tile when unfinished
  return 0
}
