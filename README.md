# ChessApp UI Components

This repository contains a modular chess UI foundation with:

1. **Custom SVG chess pieces** (cartoonish, flat, bold silhouettes).
2. **A presentational FEN-driven chessboard** that renders an 8x8 board with orientation and visual state support.
3. **An interactive click-to-move controller** using `chess.js` for legal move generation and game state transitions.

---

## What was delivered across PRs

### 1) Custom piece set (SVG)

Implemented reusable piece rendering via:

- `ChessPiece` API:
  - `type="p|n|b|r|q|k"`
  - `color="w|b"`
  - `size`
  - `className`
  - `selected`
  - `ghost`
- Complete 12-piece support via 6 glyph types x 2 colors.
- White pieces render with light fill and dark outline.
- Black pieces render with dark fill.
- `ChessPieceDemo` included for quick local preview.

Files:
- `src/components/chess/pieces/types.ts`
- `src/components/chess/pieces/pieceGlyphs.tsx`
- `src/components/chess/pieces/ChessPiece.tsx`
- `src/components/chess/pieces/ChessPieceDemo.tsx`
- `src/components/chess/pieces/index.ts`

### 2) Presentational board renderer

Implemented `ChessBoard` that:

- Renders an 8x8 responsive grid.
- Supports white/black orientation.
- Reads board position from **FEN**.
- Uses the custom `ChessPiece` SVG components.
- Exposes view-state props:
  - `selectedSquare`
  - `legalMoves`
  - `lastMove`
  - `checkSquare`
- Supports square click callback via `onSquareClick`.
- Displays board coordinates (files/ranks) cleanly.

Files:
- `src/components/chess/board/types.ts`
- `src/components/chess/board/fen.ts`
- `src/components/chess/board/ChessBoard.tsx`
- `src/components/chess/board/index.ts`

### 3) Interactive click-to-move behavior (this PR)

Implemented controller-level interaction logic with `chess.js`:

- Click a piece on side-to-move to select it.
- Show only that piece's legal destination squares.
- Click legal destination to make move.
- Deselect on selected-square re-click.
- Deselect on invalid target click.
- Turn switching handled by `chess.js` after each move.
- Board re-renders from updated FEN.
- Tracks and exposes:
  - selected square
  - legal moves
  - last move
  - side-to-move king check square

Files:
- `src/components/chess/game/types.ts`
- `src/components/chess/game/useChessGame.ts`
- `src/components/chess/game/InteractiveChessBoard.tsx`
- `src/components/chess/game/index.ts`

---

## Architecture

The code is intentionally separated into layers:

- **Presentational layer** (`board`, `pieces`):
  - pure rendering
  - no move legality logic
- **Controller/state layer** (`game`):
  - selection and click-to-move behavior
  - legal move generation and move execution with `chess.js`

This separation keeps the API easy to extend for:

- PGN export/import
- undo/redo
- engine analysis hooks
- move annotations/classification

---

## Public APIs

### `ChessPiece`

```tsx
<ChessPiece
  type="q"
  color="w"
  size={64}
  className="piece"
  selected={false}
  ghost={false}
/>
```

### `ChessBoard` (presentational)

```tsx
<ChessBoard
  fen={fen}
  orientation="white"
  onSquareClick={(square) => console.log(square)}
  selectedSquare={selectedSquare}
  legalMoves={legalMoves}
  lastMove={lastMove}
  checkSquare={checkSquare}
/>
```

### `InteractiveChessBoard` (controller + board)

```tsx
<InteractiveChessBoard
  initialFen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  orientation="white"
  onMove={(state) => console.log(state.fen, state.lastMove)}
/>
```

### `useChessGame`

Returns controller state + actions:

- `fen`
- `turn`
- `selectedSquare`
- `legalMoves`
- `lastMove`
- `checkSquare`
- `onSquareClick(square)`
- `reset(fen?)`
- `getGame()` (raw `chess.js` instance access)

---

## Dependency choice

`chess.js` is used as the lightweight robust rules engine for:

- legal move generation
- move validation
- turn management
- FEN updates
- check detection

Dependency declared in `package.json`.

---

## Notes

- Promotion defaults to queen in click-to-move flow (`promotion: 'q'`) for now.
- No drag-and-drop behavior yet; current interaction is click-to-move.
- Automated tests are not yet included in this repository.

