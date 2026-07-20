export type Feature = 'road' | 'city' | 'field' | 'monastery'

export type Edge = 'road' | 'city' | 'field'

export interface Cell {
  feature: Feature
  edges: { n: Edge; e: Edge; s: Edge; w: Edge }
}

export interface Tile {
  id: string
  shape: ReadonlyArray<readonly [number, number]>
  cells: ReadonlyMap<string, Cell>
}

export function cellKey(x: number, y: number): string {
  return `${x},${y}`
}
