import { drawCell } from './cell'
import { drawGrid } from './grid'
import type { Camera } from './grid'
import { THEME, HUD_WIDTH } from './theme'
import type { Game } from '../core/game'
import { canPlace } from '../core/board'
import { rotatedCells } from '../core/tile'

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  game: Game,
  cam: Camera,
  hover: { gx: number; gy: number } | null,
  width: number,
  height: number,
): void {
  const boardWidth = width - HUD_WIDTH
  ctx.fillStyle = THEME.bg
  ctx.fillRect(0, 0, boardWidth, height)

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, boardWidth, height)
  ctx.clip()

  drawGrid(ctx, cam, boardWidth, height)

  for (const cell of game.board.cells.values()) {
    const px = cam.originX + cell.x * cam.cellSize
    const py = cam.originY + cell.y * cam.cellSize
    if (px + cam.cellSize < 0 || py + cam.cellSize < 0) continue
    if (px > boardWidth || py > height) continue
    drawCell(ctx, px, py, cam.cellSize, cell)
  }

  if (hover && game.current) {
    const cells = rotatedCells(game.current, game.rotation)
    const result = canPlace(game.board, cells, hover.gx, hover.gy)
    const tag: 'valid' | 'invalid' = result.ok ? 'valid' : 'invalid'
    for (const c of cells) {
      const gx = hover.gx + c.x
      const gy = hover.gy + c.y
      const px = cam.originX + gx * cam.cellSize
      const py = cam.originY + gy * cam.cellSize
      drawCell(ctx, px, py, cam.cellSize, { ...c, x: gx, y: gy }, { ghost: tag })
    }
  }

  ctx.restore()
}
