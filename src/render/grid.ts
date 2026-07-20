export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cellSize: number,
): void {
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 0; x <= width; x += cellSize) {
    ctx.moveTo(x + 0.5, 0)
    ctx.lineTo(x + 0.5, height)
  }
  for (let y = 0; y <= height; y += cellSize) {
    ctx.moveTo(0, y + 0.5)
    ctx.lineTo(width, y + 0.5)
  }
  ctx.stroke()
}
