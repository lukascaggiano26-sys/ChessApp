import type { JSX } from 'react';
import { ChessBoard } from '../board';
import type { InteractiveChessBoardProps } from './types';
import { useChessGame } from './useChessGame';

export const InteractiveChessBoard = ({
  initialFen,
  orientation = 'white',
  className,
  pieceSizeRatio,
  onMove,
}: InteractiveChessBoardProps): JSX.Element => {
  const controller = useChessGame({ initialFen, orientation, onMove });

  return (
    <ChessBoard
      className={className}
      fen={controller.fen}
      orientation={orientation}
      onSquareClick={controller.onSquareClick}
      selectedSquare={controller.selectedSquare}
      legalMoves={controller.legalMoves}
      lastMove={controller.lastMove}
      checkSquare={controller.checkSquare}
      pieceSizeRatio={pieceSizeRatio}
    />
  );
};
