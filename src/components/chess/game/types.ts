import type { BoardOrientation, LastMove, Square } from '../board';

export interface ChessControllerState {
  fen: string;
  turn: 'w' | 'b';
  selectedSquare: Square | null;
  legalMoves: Square[];
  lastMove: LastMove | null;
  checkSquare: Square | null;
  draggedSquare: Square | null;
  dragOverSquare: Square | null;
}

export interface UseChessGameOptions {
  initialFen?: string;
  orientation?: BoardOrientation;
  onMove?: (state: ChessControllerState) => void;
}

export interface InteractiveChessBoardProps {
  initialFen?: string;
  orientation?: BoardOrientation;
  className?: string;
  pieceSizeRatio?: number;
  onMove?: (state: ChessControllerState) => void;
}
