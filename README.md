# Tetrissone

A tile-laying game that mashes up **Carcassonne**'s feature-matching board with **Tetris**'s falling-shape twist. Land polyomino tiles onto the growing map so that roads, cities, and fields line up — and clear pressure by completing features before the queue overflows.

## Status

Early scaffolding. Design in flux — see [docs/design.md](docs/design.md) for the current sketch of mechanics.

## Stack

- **TypeScript** — game logic and rendering
- **Vite** — dev server and bundler
- **HTML5 Canvas** — 2D rendering surface
- **Vitest** — unit tests for board rules and scoring

The stack is a placeholder; if it makes more sense to migrate to Phaser, PixiJS, Godot, or Unity as the design settles, we will.

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

Other scripts:

```bash
npm run build     # production build to dist/
npm run preview   # serve the production build locally
npm run test      # run unit tests
npm run typecheck # tsc --noEmit
```

## Layout

```
src/           game code
  core/        rules engine (board, tiles, scoring) — no rendering
  render/      canvas rendering
  input/       pointer / keyboard input
  ui/          menus, HUD
tests/         vitest suites mirroring src/
docs/          design docs, notes
public/        static assets served as-is
```

## License

TBD.
