import { THEME, HUD_WIDTH } from './theme'
import { drawCell } from './cell'
import { rotatedCells } from '../core/tile'
import type { TileSpec } from '../core/tile'
import type { Game } from '../core/game'

function drawTilePreview(
  ctx: CanvasRenderingContext2D,
  tile: TileSpec,
  cx: number,
  cy: number,
  cellSize: number,
): void {
  const cells = rotatedCells(tile, 0)
  const xs = cells.map((c) => c.x)
  const ys = cells.map((c) => c.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const w = (maxX - minX + 1) * cellSize
  const h = (maxY - minY + 1) * cellSize
  const originX = cx - w / 2 - minX * cellSize
  const originY = cy - h / 2 - minY * cellSize
  for (const c of cells) {
    drawCell(ctx, originX + c.x * cellSize, originY + c.y * cellSize, cellSize, c)
  }
}

function drawCurrentTile(
  ctx: CanvasRenderingContext2D,
  game: Game,
  cx: number,
  cy: number,
  cellSize: number,
): void {
  if (!game.current) return
  const cells = rotatedCells(game.current, game.rotation)
  const xs = cells.map((c) => c.x)
  const ys = cells.map((c) => c.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const w = (maxX - minX + 1) * cellSize
  const h = (maxY - minY + 1) * cellSize
  const originX = cx - w / 2 - minX * cellSize
  const originY = cy - h / 2 - minY * cellSize
  for (const c of cells) {
    drawCell(ctx, originX + c.x * cellSize, originY + c.y * cellSize, cellSize, c)
  }
}

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  game: Game,
  upcoming: TileSpec[],
  width: number,
  height: number,
): void {
  const x = width - HUD_WIDTH
  ctx.fillStyle = THEME.hudBg
  ctx.fillRect(x, 0, HUD_WIDTH, height)
  ctx.strokeStyle = THEME.hudBorder
  ctx.beginPath()
  ctx.moveTo(x + 0.5, 0)
  ctx.lineTo(x + 0.5, height)
  ctx.stroke()

  ctx.fillStyle = THEME.text
  ctx.font = '700 22px system-ui, sans-serif'
  ctx.fillText('Tetrissone', x + 20, 40)

  ctx.fillStyle = THEME.textDim
  ctx.font = '12px system-ui, sans-serif'
  ctx.fillText('Carcassonne × Tetris', x + 20, 58)

  ctx.fillStyle = THEME.textDim
  ctx.font = '11px system-ui, sans-serif'
  ctx.fillText('CURRENT', x + 20, 92)

  drawCurrentTile(ctx, game, x + HUD_WIDTH / 2, 170, 48)

  ctx.fillStyle = THEME.textDim
  ctx.font = '11px system-ui, sans-serif'
  ctx.fillText('NEXT', x + 20, 260)

  const previewCellSize = 22
  let py = 300
  for (let i = 0; i < upcoming.length; i++) {
    drawTilePreview(ctx, upcoming[i]!, x + HUD_WIDTH / 2, py, previewCellSize)
    py += 76
  }

  const bottomY = height - 140
  ctx.fillStyle = THEME.textDim
  ctx.font = '11px system-ui, sans-serif'
  ctx.fillText('STATS', x + 20, bottomY)
  ctx.fillStyle = THEME.text
  ctx.font = '600 14px system-ui, sans-serif'
  ctx.fillText(`Placed: ${game.placed}`, x + 20, bottomY + 24)
  ctx.fillText(`Bag: ${game.bag.remaining.length}`, x + 20, bottomY + 46)

  ctx.fillStyle = THEME.textFaint
  ctx.font = '11px system-ui, sans-serif'
  ctx.fillText('R rotate  ·  click to place', x + 20, height - 20)
}
