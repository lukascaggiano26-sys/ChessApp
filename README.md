# ChessApp UI Components

A modular chess UI foundation with:

- custom SVG chess pieces,
- a presentational FEN-driven board,
- a controller hook/wrapper for click-to-move **and** drag-and-drop movement.

## Features delivered

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
