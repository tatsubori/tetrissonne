export type Edge = 'road' | 'city' | 'field'
export type CenterFeature = Edge | 'monastery'
export type EdgeSide = 'n' | 'e' | 's' | 'w'

export const SIDES: EdgeSide[] = ['n', 'e', 's', 'w']

export function oppositeSide(s: EdgeSide): EdgeSide {
  if (s === 'n') return 's'
  if (s === 's') return 'n'
  if (s === 'e') return 'w'
  return 'e'
}

export function sideDelta(s: EdgeSide): { dx: number; dy: number } {
  if (s === 'n') return { dx: 0, dy: -1 }
  if (s === 'e') return { dx: 1, dy: 0 }
  if (s === 's') return { dx: 0, dy: 1 }
  return { dx: -1, dy: 0 }
}

export interface CellSpec {
  x: number
  y: number
  center: CenterFeature
  edges: [Edge, Edge, Edge, Edge]
}

export interface TileSpec {
  id: string
  cells: CellSpec[]
}

export type Rotation = 0 | 1 | 2 | 3

export interface PlacedCell {
  x: number
  y: number
  center: CenterFeature
  edges: { n: Edge; e: Edge; s: Edge; w: Edge }
}

export function rotatedCells(tile: TileSpec, rotation: Rotation): PlacedCell[] {
  return tile.cells.map((cell) => {
    let x = cell.x
    let y = cell.y
    for (let i = 0; i < rotation; i++) {
      const nx = -y || 0
      const ny = x
      x = nx
      y = ny
    }
    let edges = cell.edges
    for (let i = 0; i < rotation; i++) {
      edges = [edges[3], edges[0], edges[1], edges[2]]
    }
    return {
      x,
      y,
      center: cell.center,
      edges: { n: edges[0], e: edges[1], s: edges[2], w: edges[3] },
    }
  })
}

export function cellKey(x: number, y: number): string {
  return `${x},${y}`
}
