export const THEME = {
  bg: '#141414',
  hudBg: '#1c1c1e',
  hudBorder: '#2b2b2e',
  grid: '#252527',
  cellBorder: '#0f0f10',
  text: '#eaeaea',
  textDim: '#8a8a8a',
  textFaint: '#5a5a5a',

  field: '#5a8a3f',
  fieldEdge: '#4a7532',
  road: '#c9a273',
  roadEdge: '#7d5f43',
  city: '#5a4a3a',
  cityWall: '#3a2f24',
  monastery: '#e6c34a',
  villageWall: '#d9cdb4',
  villageRoof: '#a6473a',
  villageEdge: '#4a3b30',

  ghostValid: 'rgba(120, 200, 140, 0.85)',
  ghostInvalid: 'rgba(220, 90, 90, 0.85)',
  ghostOutline: 'rgba(255, 255, 255, 0.9)',

  meepleOutline: '#111',
  meepleHint: 'rgba(255, 255, 255, 0.55)',
} as const

export const PLAYER_COLORS = ['#e0524d', '#4a90d9', '#4bb262', '#e5b93c'] as const

export function playerColor(i: number): string {
  return PLAYER_COLORS[i % PLAYER_COLORS.length]!
}

export const CELL_SIZE = 56
export const HUD_WIDTH = 260
