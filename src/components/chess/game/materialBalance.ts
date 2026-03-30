import { useMemo } from 'react';
import { parseFenBoard } from '../board';
import type { PlayerSide } from './perspectiveUtils';

export interface MaterialBalance {
  whiteTotal: number;
  blackTotal: number;
  whiteMinusBlack: number;
  perspectiveScore: number;
}

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export const getMaterialBalanceFromFen = (fen: string, perspective: PlayerSide = 'white'): MaterialBalance => {
  const board = parseFenBoard(fen);

  let whiteTotal = 0;
  let blackTotal = 0;

  for (const piece of board.values()) {
    const pieceValue = PIECE_VALUES[piece.type] ?? 0;
    if (piece.color === 'w') {
      whiteTotal += pieceValue;
    } else {
      blackTotal += pieceValue;
    }
  }

  const whiteMinusBlack = whiteTotal - blackTotal;
  const perspectiveScore = perspective === 'white' ? whiteMinusBlack : -whiteMinusBlack;

  return {
    whiteTotal,
    blackTotal,
    whiteMinusBlack,
    perspectiveScore,
  };
};

export const useMaterialBalance = (fen: string, perspective: PlayerSide = 'white'): MaterialBalance =>
  useMemo(() => getMaterialBalanceFromFen(fen, perspective), [fen, perspective]);
