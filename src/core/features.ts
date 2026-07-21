import { SIDES } from './tile'
import type { Edge, EdgeSide, PlacedCell } from './tile'

export function edgesOf(cell: PlacedCell, kind: Edge): EdgeSide[] {
  return SIDES.filter((s) => cell.edges[s] === kind)
}

// How the road stubs on a single cell are joined internally. A straight/curve
// (2 stubs) flows through as one road. A road terminator on the cell ends every
// road meeting there, making each stub its own road: that's a church (monastery)
// or the village that sits at a 3-/4-way junction. This applies to both
// placement and scoring.
export function roadGroups(cell: PlacedCell): EdgeSide[][] {
  const stubs = edgesOf(cell, 'road')
  if (stubs.length === 0) return []
  if (isRoadSeparator(cell)) return stubs.map((s) => [s])
  return [stubs]
}

// A junction (3+ roads meeting) carries a village that terminates those roads.
// It is a terminator only — not a feature a meeple can occupy.
export function isRoadVillage(cell: PlacedCell): boolean {
  return cell.center !== 'monastery' && edgesOf(cell, 'road').length >= 3
}

// A cell feature that ends the roads passing through it: a church (monastery) or
// a village junction.
function isRoadSeparator(cell: PlacedCell): boolean {
  return cell.center === 'monastery' || isRoadVillage(cell)
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
