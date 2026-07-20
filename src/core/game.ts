import { createBoard, canPlace, place } from './board'
import type { Board } from './board'
import { makeBag, draw, peek } from './bag'
import type { Bag } from './bag'
import { rotatedCells } from './tile'
import type { Rotation, TileSpec } from './tile'
import { CATALOG, STARTER_TILE } from './tiles'

export interface Game {
  board: Board
  bag: Bag
  current: TileSpec | null
  rotation: Rotation
  placed: number
}

export function newGame(seed: number): Game {
  const board = createBoard()
  const starterCells = rotatedCells(STARTER_TILE, 0)
  place(board, starterCells, 0, 0)
  const bag = makeBag(CATALOG, seed)
  const current = draw(bag)
  return { board, bag, current, rotation: 0, placed: 1 }
}

export function rotate(game: Game, delta: 1 | -1): void {
  game.rotation = ((game.rotation + delta + 4) % 4) as Rotation
}

export function tryPlace(game: Game, gx: number, gy: number): boolean {
  if (!game.current) return false
  const cells = rotatedCells(game.current, game.rotation)
  const result = canPlace(game.board, cells, gx, gy)
  if (!result.ok) return false
  place(game.board, cells, gx, gy)
  game.placed += 1
  game.current = draw(game.bag)
  game.rotation = 0
  return true
}

export function currentPreview(game: Game) {
  if (!game.current) return null
  return rotatedCells(game.current, game.rotation)
}

export function upcoming(game: Game, n: number): TileSpec[] {
  return peek(game.bag, n)
}
