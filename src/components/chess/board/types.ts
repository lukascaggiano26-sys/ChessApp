import type { PieceColor, PieceType } from '../pieces';

export type BoardOrientation = 'white' | 'black';

export type FileChar = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
export type RankChar = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

export type Square = `${FileChar}${RankChar}`;

export interface BoardPiece {
  type: PieceType;
  color: PieceColor;
}

export interface LastMove {
  from: Square;
  to: Square;
}

export interface ChessBoardProps {
  fen: string;
  orientation?: BoardOrientation;
  onSquareClick?: (square: Square) => void;
  selectedSquare?: Square | null;
  legalMoves?: Square[];
  lastMove?: LastMove | null;
  checkSquare?: Square | null;
  draggedSquare?: Square | null;
  dragOverSquare?: Square | null;
  onPieceDragStart?: (square: Square) => void;
  onPieceDragEnter?: (square: Square) => void;
  onPieceDrop?: (square: Square) => void;
  onPieceDragEnd?: () => void;
  className?: string;
  pieceSizeRatio?: number;
  bestMoveArrow?: LastMove | null;
}
