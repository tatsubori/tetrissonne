import { THEME } from './theme'
import type { Edge, PlacedCell } from '../core/tile'

function edgeFill(edge: Edge): string {
  if (edge === 'road') return THEME.road
  if (edge === 'city') return THEME.city
  return THEME.field
}

function edgeOutline(edge: Edge): string {
  if (edge === 'road') return THEME.roadEdge
  if (edge === 'city') return THEME.cityWall
  return THEME.fieldEdge
}

export function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  cell: PlacedCell,
  opts: { ghost?: 'valid' | 'invalid' } = {},
): void {
  const cx = x + size / 2
  const cy = y + size / 2

  const tri = (p1x: number, p1y: number, p2x: number, p2y: number, fill: string) => {
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(p1x, p1y)
    ctx.lineTo(p2x, p2y)
    ctx.closePath()
    ctx.fillStyle = fill
    ctx.fill()
  }

  tri(x, y, x + size, y, edgeFill(cell.edges.n))
  tri(x + size, y, x + size, y + size, edgeFill(cell.edges.e))
  tri(x + size, y + size, x, y + size, edgeFill(cell.edges.s))
  tri(x, y + size, x, y, edgeFill(cell.edges.w))

  ctx.lineWidth = 1
  ctx.strokeStyle = THEME.cellBorder
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1)

  const roadW = Math.max(4, size * 0.14)
  ctx.strokeStyle = THEME.roadEdge
  ctx.lineWidth = roadW + 2
  ctx.lineCap = 'round'
  const roads: Array<[number, number]> = []
  if (cell.edges.n === 'road') roads.push([cx, y])
  if (cell.edges.e === 'road') roads.push([x + size, cy])
  if (cell.edges.s === 'road') roads.push([cx, y + size])
  if (cell.edges.w === 'road') roads.push([x, cy])
  if (roads.length > 0) {
    for (const [rx, ry] of roads) {
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(rx, ry)
      ctx.stroke()
    }
    ctx.strokeStyle = THEME.road
    ctx.lineWidth = roadW
    for (const [rx, ry] of roads) {
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(rx, ry)
      ctx.stroke()
    }
  }

  const walls: Array<[number, number, number, number]> = []
  const inset = size * 0.15
  if (cell.edges.n === 'city') walls.push([x + inset, y + inset, x + size - inset, y + inset])
  if (cell.edges.e === 'city') walls.push([x + size - inset, y + inset, x + size - inset, y + size - inset])
  if (cell.edges.s === 'city') walls.push([x + inset, y + size - inset, x + size - inset, y + size - inset])
  if (cell.edges.w === 'city') walls.push([x + inset, y + inset, x + inset, y + size - inset])
  if (walls.length > 0) {
    ctx.strokeStyle = edgeOutline('city')
    ctx.lineWidth = 2
    for (const [x1, y1, x2, y2] of walls) {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
  }

  if (cell.center === 'monastery') {
    const s = size * 0.32
    ctx.fillStyle = THEME.monastery
    ctx.fillRect(cx - s / 2, cy - s / 2, s, s)
    ctx.strokeStyle = THEME.cityWall
    ctx.lineWidth = 1.5
    ctx.strokeRect(cx - s / 2, cy - s / 2, s, s)
    ctx.beginPath()
    ctx.moveTo(cx, cy - s / 2 + 3)
    ctx.lineTo(cx, cy + s / 2 - 3)
    ctx.moveTo(cx - s / 2 + 3, cy)
    ctx.lineTo(cx + s / 2 - 3, cy)
    ctx.stroke()
  }

  if (opts.ghost) {
    ctx.fillStyle = opts.ghost === 'valid' ? THEME.ghostValid : THEME.ghostInvalid
    ctx.globalAlpha = 0.35
    ctx.fillRect(x, y, size, size)
    ctx.globalAlpha = 1
    ctx.strokeStyle = opts.ghost === 'valid' ? THEME.ghostValid : THEME.ghostInvalid
    ctx.lineWidth = 2
    ctx.strokeRect(x + 1, y + 1, size - 2, size - 2)
  }
}
