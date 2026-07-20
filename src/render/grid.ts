import { THEME } from './theme'

export interface Camera {
  originX: number
  originY: number
  cellSize: number
}

export function screenToCell(cam: Camera, sx: number, sy: number): { gx: number; gy: number } {
  return {
    gx: Math.floor((sx - cam.originX) / cam.cellSize),
    gy: Math.floor((sy - cam.originY) / cam.cellSize),
  }
}

export function cellToScreen(cam: Camera, gx: number, gy: number): { x: number; y: number } {
  return {
    x: cam.originX + gx * cam.cellSize,
    y: cam.originY + gy * cam.cellSize,
  }
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  width: number,
  height: number,
): void {
  ctx.strokeStyle = THEME.grid
  ctx.lineWidth = 1
  const startX = cam.originX - Math.ceil(cam.originX / cam.cellSize) * cam.cellSize
  const startY = cam.originY - Math.ceil(cam.originY / cam.cellSize) * cam.cellSize
  ctx.beginPath()
  for (let x = startX; x <= width; x += cam.cellSize) {
    ctx.moveTo(Math.round(x) + 0.5, 0)
    ctx.lineTo(Math.round(x) + 0.5, height)
  }
  for (let y = startY; y <= height; y += cam.cellSize) {
    ctx.moveTo(0, Math.round(y) + 0.5)
    ctx.lineTo(width, Math.round(y) + 0.5)
  }
  ctx.stroke()
}
