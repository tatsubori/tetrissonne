import type { TileSpec } from './tile'

export interface Bag {
  remaining: TileSpec[]
}

export function makeBag(catalog: TileSpec[], seed: number): Bag {
  const arr = [...catalog]
  let s = seed >>> 0
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0
    const j = s % (i + 1)
    const tmp = arr[i]!
    arr[i] = arr[j]!
    arr[j] = tmp
  }
  return { remaining: arr }
}

export function draw(bag: Bag): TileSpec | null {
  return bag.remaining.shift() ?? null
}

export function peek(bag: Bag, n: number): TileSpec[] {
  return bag.remaining.slice(0, n)
}
