import { newGame, rotate, tryPlace, upcoming } from './core/game'
import { drawBoard } from './render/board'
import { drawHUD } from './render/hud'
import { screenToCell } from './render/grid'
import type { Camera } from './render/grid'
import { CELL_SIZE, HUD_WIDTH } from './render/theme'

const canvas = document.getElementById('game') as HTMLCanvasElement | null
if (!canvas) throw new Error('#game canvas missing')
const ctx = canvas.getContext('2d')
if (!ctx) throw new Error('2D context unavailable')

const dpr = Math.min(window.devicePixelRatio || 1, 2)

function resize(): void {
  const cssW = window.innerWidth
  const cssH = window.innerHeight
  canvas!.width = Math.round(cssW * dpr)
  canvas!.height = Math.round(cssH * dpr)
  canvas!.style.width = cssW + 'px'
  canvas!.style.height = cssH + 'px'
  ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
}
resize()
window.addEventListener('resize', () => {
  resize()
  centerCamera()
})

const seed = Math.floor(Math.random() * 0xffffffff)
const game = newGame(seed)

const cam: Camera = { originX: 0, originY: 0, cellSize: CELL_SIZE }
function centerCamera(): void {
  const boardW = window.innerWidth - HUD_WIDTH
  const boardH = window.innerHeight
  cam.originX = Math.floor(boardW / 2 - cam.cellSize / 2)
  cam.originY = Math.floor(boardH / 2 - cam.cellSize / 2)
}
centerCamera()

let hover: { gx: number; gy: number } | null = null
let dirty = true

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas!.getBoundingClientRect()
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top
  if (sx > window.innerWidth - HUD_WIDTH) {
    if (hover) {
      hover = null
      dirty = true
    }
    return
  }
  const next = screenToCell(cam, sx, sy)
  if (!hover || hover.gx !== next.gx || hover.gy !== next.gy) {
    hover = next
    dirty = true
  }
})

canvas.addEventListener('mouseleave', () => {
  if (hover) {
    hover = null
    dirty = true
  }
})

canvas.addEventListener('click', (e) => {
  const rect = canvas!.getBoundingClientRect()
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top
  if (sx > window.innerWidth - HUD_WIDTH) return
  const target = screenToCell(cam, sx, sy)
  if (tryPlace(game, target.gx, target.gy)) {
    dirty = true
  }
})

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  rotate(game, -1)
  dirty = true
})

window.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') {
    rotate(game, e.shiftKey ? -1 : 1)
    dirty = true
  } else if (e.key === 'q' || e.key === 'Q') {
    rotate(game, -1)
    dirty = true
  } else if (e.key === 'e' || e.key === 'E') {
    rotate(game, 1)
    dirty = true
  }
})

function render(): void {
  if (dirty) {
    const w = window.innerWidth
    const h = window.innerHeight
    drawBoard(ctx!, game, cam, hover, w, h)
    drawHUD(ctx!, game, upcoming(game, 3), w, h)
    dirty = false
  }
  requestAnimationFrame(render)
}
render()
