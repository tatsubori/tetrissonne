import { SIDES } from './tile'
import type { Edge, EdgeSide, PlacedCell } from './tile'

export function edgesOf(cell: PlacedCell, kind: Edge): EdgeSide[] {
  return SIDES.filter((s) => cell.edges[s] === kind)
}

// How the road stubs on a single cell are joined internally.
// 2 stubs form one through-group (straight/curve). Otherwise each stub is
// its own group (solo dead-end for 1 stub; a hub/village for 3-4 stubs).
export function roadGroups(cell: PlacedCell): EdgeSide[][] {
  const stubs = edgesOf(cell, 'road')
  if (stubs.length === 2) return [stubs]
  return stubs.map((s) => [s])
}

// All city edges on a cell belong to one segment. This is a simplification
// of Carcassonne (some real tiles have two separate city sections), sufficient
// for the current catalog.
export function cityGroups(cell: PlacedCell): EdgeSide[][] {
  const stubs = edgesOf(cell, 'city')
  if (stubs.length === 0) return []
  return [stubs]
}

// All field edges on a cell belong to one field group. Real Carcassonne splits
// a tile's field where a road crosses it; we ignore that split (documented
// simplification) — the current catalog rarely needs it and farms are only
// scored at game end.
export function fieldGroups(cell: PlacedCell): EdgeSide[][] {
  const stubs = edgesOf(cell, 'field')
  if (stubs.length === 0) return []
  return [stubs]
}
