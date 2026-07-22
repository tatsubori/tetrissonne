# Tetrissonne — Design Sketch

This is a working sketch, not a spec. Everything here is up for debate.

## Elevator pitch

Carcassonne, but the tile you place is not a single square — it is a **polyomino** whose cells each carry Carcassonne-style features (road, city, field, monastery). You choose where and how to rotate it, but tiles arrive on a **queue with pressure**, so you cannot deliberate forever, and unresolved features accrue tension the way an un-cleared Tetris stack does.

## Core loop

1. A polyomino tile appears at the top of the queue with its feature layout revealed.
2. The player rotates / reflects it and drops it onto a free spot on the board.
3. Placement must satisfy Carcassonne's edge-matching rule on every cell that touches an existing cell: road-to-road, city-to-city, field-to-field.
4. Completed features (closed cities, finished roads, monasteries surrounded by 8 neighbors) score immediately and clear their meeples.
5. Every N placements, the pressure counter ticks; when it hits the cap, the oldest tile in the queue force-places at the lowest-scoring legal spot the engine can find (or you lose a life — TBD).

## Where Tetris shows up

- **Shapes are polyominoes.** I-, L-, S-, T-, O-shaped multi-cell tiles instead of single squares. The game is about fitting shapes as much as matching features.
- **Rotation / reflection** work like Tetris SRS — 4 rotation states, and possibly free reflection to keep the piece set small.
- **A queue with a preview** creates the same "what's next" tension as Tetris's next-piece display.
- **Line-clear analog:** completing a feature not only scores but also **relieves pressure** on the queue, so aggressive players who chain completions can survive faster tile drops.

## What stays Carcassonne

- Feature semantics: roads, cities (with pennants), fields (feeding cities at game end), monasteries.
- Meeple economy: limited followers, deployed to claim a feature on the tile you just placed, retrieved when that feature completes.
- End-game scoring for unfinished features + fields feeding cities.

## Open questions

- **Solo vs multiplayer first?** Solo is easier to prototype and the pressure mechanic is more legible there. Multiplayer needs turn ordering that doesn't feel like Tetris-with-turns.
- **Do polyominoes break Carcassonne's edge-matching?** A single tile touching the board along 3–4 edges makes legal placements sparse. Options: soften the rule (only require matching on at least one edge, no conflicts on others), or lean into scarcity as the puzzle.
- **Pressure mechanic exact shape.** Timer? Queue length cap? Placement counter? Needs playtesting.
- **Piece set size.** Full pentomino set × Carcassonne feature combinations blows up fast. Start with a curated ~20-tile bag.

## Prototype milestones

1. **M1 — Static board, one tile.** Render a grid, place a fixed polyomino, enforce edge-matching. No queue, no scoring.
2. **M2 — Queue + rotation.** Queue of N tiles, rotate/reflect the head, place it. Still no scoring.
3. **M3 — Feature completion.** Detect closed cities / finished roads, remove meeples, score.
4. **M4 — Pressure.** Add the pressure counter and force-placement rule; tune to feel like a game.
5. **M5 — Playtest and iterate.** Everything after this depends on what M4 feels like in hand.
