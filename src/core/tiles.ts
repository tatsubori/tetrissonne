import type { TileSpec } from './tile'

const F = 'field'
const R = 'road'
const C = 'city'

export const STARTER_TILE: TileSpec = {
  id: 'starter',
  cells: [
    { x: 0, y: 0, center: F, edges: [C, R, F, R] },
  ],
}

export const CATALOG: TileSpec[] = [
  { id: 'straight_road', cells: [{ x: 0, y: 0, center: F, edges: [R, F, R, F] }] },
  { id: 'straight_road', cells: [{ x: 0, y: 0, center: F, edges: [R, F, R, F] }] },
  { id: 'curve_road_ne', cells: [{ x: 0, y: 0, center: F, edges: [R, R, F, F] }] },
  { id: 'curve_road_ne', cells: [{ x: 0, y: 0, center: F, edges: [R, R, F, F] }] },
  { id: 't_road', cells: [{ x: 0, y: 0, center: F, edges: [R, R, R, F] }] },
  { id: 'crossroads', cells: [{ x: 0, y: 0, center: F, edges: [R, R, R, R] }] },
  { id: 'city_side', cells: [{ x: 0, y: 0, center: F, edges: [C, F, F, F] }] },
  { id: 'city_side', cells: [{ x: 0, y: 0, center: F, edges: [C, F, F, F] }] },
  { id: 'city_wall', cells: [{ x: 0, y: 0, center: F, edges: [C, C, F, F] }] },
  { id: 'city_road', cells: [{ x: 0, y: 0, center: F, edges: [C, R, F, R] }] },
  { id: 'monastery', cells: [{ x: 0, y: 0, center: 'monastery', edges: [F, F, F, F] }] },
  { id: 'monastery_road', cells: [{ x: 0, y: 0, center: 'monastery', edges: [F, F, R, F] }] },
  {
    id: 'domino_road',
    cells: [
      { x: 0, y: 0, center: F, edges: [F, R, F, R] },
      { x: 1, y: 0, center: F, edges: [F, R, F, R] },
    ],
  },
  {
    id: 'domino_city',
    cells: [
      { x: 0, y: 0, center: C, edges: [C, C, F, C] },
      { x: 1, y: 0, center: C, edges: [C, C, F, C] },
    ],
  },
  {
    id: 'L_road',
    cells: [
      { x: 0, y: 0, center: F, edges: [R, F, R, F] },
      { x: 0, y: 1, center: F, edges: [R, R, F, F] },
      { x: 1, y: 1, center: F, edges: [F, F, F, R] },
    ],
  },
  {
    id: 'S_field',
    cells: [
      { x: 0, y: 0, center: F, edges: [F, F, F, F] },
      { x: 1, y: 0, center: F, edges: [F, F, F, F] },
      { x: 1, y: 1, center: F, edges: [F, F, F, F] },
      { x: 2, y: 1, center: F, edges: [F, F, F, F] },
    ],
  },
  {
    id: 'I_road_3',
    cells: [
      { x: 0, y: 0, center: F, edges: [F, R, F, R] },
      { x: 1, y: 0, center: F, edges: [F, R, F, R] },
      { x: 2, y: 0, center: F, edges: [F, R, F, R] },
    ],
  },
  {
    id: 'O_city_field',
    cells: [
      { x: 0, y: 0, center: C, edges: [C, F, F, C] },
      { x: 1, y: 0, center: C, edges: [C, C, F, F] },
      { x: 0, y: 1, center: F, edges: [F, F, F, F] },
      { x: 1, y: 1, center: F, edges: [F, F, F, F] },
    ],
  },
]
