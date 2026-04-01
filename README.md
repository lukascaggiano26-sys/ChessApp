# ChessApp UI Components

A modular chess UI foundation with:

- custom SVG chess pieces,
- a presentational FEN-driven board,
- a controller hook/wrapper for click-to-move **and** drag-and-drop movement.

## Features delivered

## Run the interactive UI locally

You can now launch a playable interactive board UI from this repo.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open the local URL shown by Vite (typically `http://localhost:5173`).
4. Play using either:
   - tap/click-to-move, or
   - drag-and-drop (desktop pointers).
5. Use the control panel to:
   - start a new game/reset
   - undo/redo
   - load FEN / copy current FEN
   - inspect turn, status, and move list

### Custom SVG piece set
- 12 pieces via reusable `ChessPiece` (`type`, `color`, `size`, `className`, `selected`, `ghost`).
- Flat, bold, high-contrast style.
- Demo component: `ChessPieceDemo`.

### Presentational board
- `ChessBoard` renders an 8x8 responsive grid from FEN.
- Supports `orientation="white" | "black"`.
- Renders rank/file coordinates.
- Visual highlights:
  - selected square
  - legal destinations
  - last move
  - check square
- Uses only custom SVG pieces (no Unicode).


### UI polish
- Smooth hover response on squares with subtle brightness/ring feedback.
- Stronger selected square treatment while keeping pieces visually primary.
- Legal move indicators use:
  - center dots for quiet moves
  - outer rings for captures
- Refined last-move and check highlights with better contrast hierarchy.
- Subtle transition timing for square/piece state changes (no heavy animation).



### Mobile responsiveness
- Board width is constrained to viewport and remains square.
- Piece sizing scales up slightly on small screens to keep silhouettes readable.
- Control buttons become larger touch targets and stack in a 2-column grid on phones.
- On coarse-pointer devices, drag behavior de-emphasizes and tap-to-move remains the primary interaction.

### Control panel
- `ChessBoardWithControls` adds:
  - New game / Reset
  - Undo / Redo
  - Load FEN
  - Copy current FEN
  - Turn indicator
  - Game status (checkmate, stalemate, draw, insufficient material, check)
  - Move list (simple SAN)

### Interactive controller
- `useChessGame` + `InteractiveChessBoard` integrate `chess.js` for rules/state.
- Supports both interaction models:
  - click-to-move
  - drag-and-drop
- Drag behavior:
  - draggable side-to-move pieces only
  - legal targets highlighted during drag
  - custom piece ghost drag preview (from SVG clone)
  - illegal drops prevented
- Move result tracking:
  - updated FEN
  - turn switching
  - last move
  - check square

## Architecture

- `src/components/chess/pieces/*` → piece visuals only.
- `src/components/chess/board/*` → board rendering only.
- `src/components/chess/game/*` → game/controller logic and interactions.

This separation is designed for future PGN, undo/redo, engine analysis, and move classification.

## Public API

### `ChessPiece`
```tsx
<ChessPiece type="q" color="w" size={64} selected={false} ghost={false} />
```

### `ChessBoard` (presentational)
```tsx
<ChessBoard
  fen={fen}
  orientation="white"
  onSquareClick={handleSquareClick}
  selectedSquare={selectedSquare}
  legalMoves={legalMoves}
  lastMove={lastMove}
  checkSquare={checkSquare}
  draggedSquare={draggedSquare}
  dragOverSquare={dragOverSquare}
  onPieceDragStart={onPieceDragStart}
  onPieceDragEnter={onPieceDragEnter}
  onPieceDrop={onPieceDrop}
  onPieceDragEnd={onPieceDragEnd}
/>
```

### `ChessBoardWithControls`
```tsx
<ChessBoardWithControls orientation="white" showMoveList />
```

### `InteractiveChessBoard`
```tsx
<InteractiveChessBoard
  initialFen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  orientation="black"
  onMove={(state) => console.log(state.fen, state.lastMove)}
/>
```

### `useChessGame`
Returns state + handlers:
- `fen`, `turn`
- `selectedSquare`, `legalMoves`
- `lastMove`, `checkSquare`
- `draggedSquare`, `dragOverSquare`
- `onSquareClick`
- `onPieceDragStart`, `onPieceDragEnter`, `onPieceDrop`, `onPieceDragEnd`
- `reset`, `getGame`

## Dependency

`chess.js` is used as the lightweight robust rules engine.

## Notes

- Promotion currently defaults to queen for move execution.
- Drag-and-drop targets are square-driven (no fragile pixel coordinate math), so flipped orientation remains correct.

## Move-review regression checks

Run deterministic classification fixtures (no UI rendering required):

```bash
npm run check:move-review
```

This validates focused `Best` vs `Excellent` boundary fixtures, including:
- `1. e4` followed by non-best `...e6` (must not be `Best`)
- exact engine-best move (must be `Best`)
- near-best non-identical move (must be `Excellent`)
- a mate-score scenario
