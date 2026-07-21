import { THEME, HUD_WIDTH, playerColor } from './theme'
import { drawCell } from './cell'
import { drawMeeple } from './meeple'
import { rotatedCells } from '../core/tile'
import type { TileSpec } from '../core/tile'
import { currentPlayer, winners, MEEPLES_PER_PLAYER } from '../core/game'
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

function drawScores(ctx: CanvasRenderingContext2D, game: Game, x: number, top: number): number {
  ctx.fillStyle = THEME.textDim
  ctx.font = '11px system-ui, sans-serif'
  ctx.fillText('SCORES', x + 20, top)

  let y = top + 24
  const win = game.phase === 'game-over' ? new Set(winners(game)) : new Set<number>()
  game.players.forEach((p, i) => {
    const active = game.phase !== 'game-over' && i === game.turn
    // color swatch
    ctx.fillStyle = playerColor(i)
    ctx.fillRect(x + 20, y - 11, 12, 12)
    if (active) {
      ctx.strokeStyle = THEME.text
      ctx.lineWidth = 1.5
      ctx.strokeRect(x + 18.5, y - 12.5, 15, 15)
    }

    ctx.fillStyle = active || win.has(i) ? THEME.text : THEME.textDim
    ctx.font = `${active || win.has(i) ? '600 ' : ''}14px system-ui, sans-serif`
    const crown = win.has(i) ? ' ★' : ''
    ctx.fillText(`${p.name}${crown}`, x + 40, y)

    ctx.textAlign = 'right'
    ctx.fillText(String(p.score), x + HUD_WIDTH - 20, y)
    ctx.textAlign = 'left'

    // remaining meeples as pips
    ctx.fillStyle = THEME.textFaint
    ctx.font = '11px system-ui, sans-serif'
    ctx.fillText(`meeples ${p.meeples}/${MEEPLES_PER_PLAYER}`, x + 40, y + 16)

    y += 40
  })
  return y
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

  ctx.textAlign = 'left'
  ctx.fillStyle = THEME.text
  ctx.font = '700 22px system-ui, sans-serif'
  ctx.fillText('Tetrissone', x + 20, 40)

  ctx.fillStyle = THEME.textDim
  ctx.font = '12px system-ui, sans-serif'
  ctx.fillText('Carcassonne × Tetris', x + 20, 58)

  // Current tile
  ctx.fillStyle = THEME.textDim
  ctx.font = '11px system-ui, sans-serif'
  ctx.fillText('CURRENT', x + 20, 92)
  if (game.current) drawTilePreview(ctx, game.current, x + HUD_WIDTH / 2, 150, 40)

  // Next tiles
  ctx.fillStyle = THEME.textDim
  ctx.font = '11px system-ui, sans-serif'
  ctx.fillText('NEXT', x + 20, 214)
  let py = 244
  for (let i = 0; i < upcoming.length; i++) {
    drawTilePreview(ctx, upcoming[i]!, x + HUD_WIDTH / 2, py, 18)
    py += 52
  }

  // Scores
  drawScores(ctx, game, x, py + 12)

  // Phase / turn banner + controls at the bottom.
  const bannerY = height - 64
  if (game.phase === 'game-over') {
    const win = winners(game).map((i) => game.players[i]!.name)
    ctx.fillStyle = THEME.text
    ctx.font = '700 16px system-ui, sans-serif'
    ctx.fillText('GAME OVER', x + 20, bannerY)
    ctx.fillStyle = THEME.textDim
    ctx.font = '12px system-ui, sans-serif'
    ctx.fillText(win.length > 1 ? `Tie: ${win.join(', ')}` : `Winner: ${win[0]}`, x + 20, bannerY + 20)
  } else {
    const p = currentPlayer(game)
    ctx.fillStyle = playerColor(game.turn)
    drawMeeple(ctx, x + 27, bannerY - 4, 7, playerColor(game.turn))
    ctx.fillStyle = THEME.text
    ctx.font = '600 13px system-ui, sans-serif'
    ctx.fillText(`${p.name}'s turn`, x + 42, bannerY)
    ctx.fillStyle = THEME.textDim
    ctx.font = '12px system-ui, sans-serif'
    ctx.fillText(
      game.phase === 'place-tile' ? 'Place a tile' : 'Place meeple · Space to skip',
      x + 20,
      bannerY + 20,
    )
  }

  ctx.fillStyle = THEME.textFaint
  ctx.font = '11px system-ui, sans-serif'
  ctx.fillText('R rotate · click place/claim · Space skip', x + 20, height - 20)
}
