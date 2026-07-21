import { THEME } from './theme'
import { sideDelta } from '../core/tile'
import type { Anchor } from '../core/game'
import type { Camera } from './grid'

// Position a meeple within its cell: pulled toward the claimed edge for
// roads/cities, at the centre for monasteries and fields.
export function meepleScreenPos(cam: Camera, anchor: Anchor): { x: number; y: number } {
  const cx = cam.originX + anchor.x * cam.cellSize + cam.cellSize / 2
  const cy = cam.originY + anchor.y * cam.cellSize + cam.cellSize / 2
  if ((anchor.feature === 'road' || anchor.feature === 'city') && anchor.side) {
    const { dx, dy } = sideDelta(anchor.side)
    return { x: cx + dx * cam.cellSize * 0.28, y: cy + dy * cam.cellSize * 0.28 }
  }
  return { x: cx, y: cy }
}

// A little pawn: head + shoulders. `r` is roughly half the meeple height.
export function drawMeeple(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha = 1,
): void {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.strokeStyle = THEME.meepleOutline
  ctx.lineWidth = Math.max(1, r * 0.14)

  const headR = r * 0.42
  const headCy = y - r * 0.45

  // body
  ctx.beginPath()
  ctx.moveTo(x, headCy)
  ctx.quadraticCurveTo(x - r * 0.9, y - r * 0.1, x - r * 0.85, y + r)
  ctx.lineTo(x + r * 0.85, y + r)
  ctx.quadraticCurveTo(x + r * 0.9, y - r * 0.1, x, headCy)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // head
  ctx.beginPath()
  ctx.arc(x, headCy, headR, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}
