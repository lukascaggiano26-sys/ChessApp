import { Chess } from 'chess.js';
import { getMaterialBalanceFromFen } from './materialBalance';
import type { MaterialSnapshot, ReviewMoveInput, ReviewSide } from './moveReviewTypes';

export interface TraversedPly {
  plyIndex: number;
  fenBefore: string;
  fenAfter: string;
  playedBy: ReviewSide;
  san: string;
  uci: string;
  materialBefore: MaterialSnapshot;
  materialAfter: MaterialSnapshot;
}

const toReviewSide = (turn: 'w' | 'b'): ReviewSide => (turn === 'w' ? 'white' : 'black');

const moveToUci = (move: { from: string; to: string; promotion?: string }): string => `${move.from}${move.to}${move.promotion ?? ''}`;

export const applyUciMoveToFen = (fen: string, uciMove: string): string | null => {
  const game = new Chess(fen);
  const from = uciMove.slice(0, 2);
  const to = uciMove.slice(2, 4);
  const promotion = uciMove.length > 4 ? uciMove.slice(4, 5) : undefined;
  const result = game.move({ from, to, promotion });
  return result ? game.fen() : null;
};

export const traverseGameMoves = (startingFen: string, moves: ReviewMoveInput[]): TraversedPly[] => {
  const replay = new Chess(startingFen);
  const plies: TraversedPly[] = [];

  for (const [index, move] of moves.entries()) {
    const fenBefore = replay.fen();
    const playedBy = toReviewSide(replay.turn());
    const materialBefore = getMaterialBalanceFromFen(fenBefore, 'white');

    const playedResult = replay.move({ from: move.from, to: move.to, promotion: move.promotion });
    if (!playedResult) {
      break;
    }

    const fenAfter = replay.fen();
    const materialAfter = getMaterialBalanceFromFen(fenAfter, 'white');

    plies.push({
      plyIndex: index,
      fenBefore,
      fenAfter,
      playedBy,
      san: playedResult.san,
      uci: moveToUci(move),
      materialBefore,
      materialAfter,
    });
  }

  return plies;
};
