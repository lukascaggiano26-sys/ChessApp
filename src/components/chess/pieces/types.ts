export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export type PieceColor = 'w' | 'b';

export interface ChessPieceProps {
  type: PieceType;
  color: PieceColor;
  size?: number | string;
  className?: string;
  selected?: boolean;
  ghost?: boolean;
  title?: string;
}
