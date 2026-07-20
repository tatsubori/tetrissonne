import { describe, expect, it } from 'vitest'
import { cellKey } from '../src/core/tile'

describe('cellKey', () => {
  it('formats coordinates as "x,y"', () => {
    expect(cellKey(3, 5)).toBe('3,5')
    expect(cellKey(-1, 0)).toBe('-1,0')
  })
})
