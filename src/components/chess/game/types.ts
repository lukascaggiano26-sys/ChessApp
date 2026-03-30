import type { BoardOrientation, LastMove, Square } from '../board';

export interface ChessGameStatus {
  checkmate: boolean;
  stalemate: boolean;
  draw: boolean;
  insufficientMaterial: boolean;
  inCheck: boolean;
}

export interface ChessControllerState {
  startingFen: string;
  fen: string;
  currentPly: number;
  turn: 'w' | 'b';
  selectedSquare: Square | null;
  legalMoves: Square[];
  lastMove: LastMove | null;
  checkSquare: Square | null;
  draggedSquare: Square | null;
  dragOverSquare: Square | null;
  movesSan: string[];
  status: ChessGameStatus;
  canUndo: boolean;
  canRedo: boolean;
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

export interface ChessBoardWithControlsProps extends InteractiveChessBoardProps {
  showMoveList?: boolean;
}
