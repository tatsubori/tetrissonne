import { drawGrid } from './render/grid'

const canvas = document.getElementById('game') as HTMLCanvasElement | null
if (!canvas) throw new Error('#game canvas missing')
const ctx = canvas.getContext('2d')
if (!ctx) throw new Error('2D context unavailable')

drawGrid(ctx, canvas.width, canvas.height, 40)
