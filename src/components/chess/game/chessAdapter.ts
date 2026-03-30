import type { LastMove, Square } from '../board';
import type { ChessControllerState, ChessGameStatus } from './types';

export type ChessMove = {
  from: string;
  to: string;
  san?: string;
};

export type ChessInstance = {
  fen: () => string;
  turn: () => 'w' | 'b';
  get: (square: string) => { type: string; color: 'w' | 'b' } | null;
  moves: (options?: { square?: string; verbose?: boolean }) => Array<string | ChessMove>;
  move: (move: { from: string; to: string; promotion?: 'q' | 'r' | 'b' | 'n' }) => ChessMove | null;
  board: () => Array<Array<{ type: string; color: 'w' | 'b' } | null>>;
  history: (options?: { verbose?: boolean }) => Array<string | ChessMove>;
  undo: () => ChessMove | null;
  load: (fen: string) => boolean;
  loadPgn: (pgn: string) => boolean;
  isCheck: () => boolean;
  inCheck?: () => boolean;
  isCheckmate?: () => boolean;
  isStalemate?: () => boolean;
  isDraw?: () => boolean;
  isInsufficientMaterial?: () => boolean;
};

export const asSquare = (value: string): Square => value as Square;

export const readStatus = (game: ChessInstance): ChessGameStatus => ({
  checkmate: game.isCheckmate?.() ?? false,
  stalemate: game.isStalemate?.() ?? false,
  draw: game.isDraw?.() ?? false,
  insufficientMaterial: game.isInsufficientMaterial?.() ?? false,
  inCheck: game.isCheck?.() ?? game.inCheck?.() ?? false,
});

export const getMoveListSan = (game: ChessInstance): string[] =>
  game
    .history()
    .map((move) => (typeof move === 'string' ? move : move.san ?? ''))
    .filter(Boolean);

export const getLegalDestinations = (game: ChessInstance, from: Square): Square[] => {
  const moves = game.moves({ square: from, verbose: true });

  return moves
    .map((move) => (typeof move === 'string' ? null : move.to))
    .filter((destination): destination is string => Boolean(destination))
    .map(asSquare);
};

export const kingSquareForTurn = (game: ChessInstance): Square | null => {
  const sideToMove = game.turn();
  if (!readStatus(game).inCheck) {
    return null;
  }

  const rows = game.board();
  for (let rankIndex = 0; rankIndex < rows.length; rankIndex += 1) {
    for (let fileIndex = 0; fileIndex < rows[rankIndex].length; fileIndex += 1) {
      const piece = rows[rankIndex][fileIndex];
      if (!piece || piece.type !== 'k' || piece.color !== sideToMove) {
        continue;
      }

      const file = String.fromCharCode(97 + fileIndex);
      const rank = String(8 - rankIndex);
      return `${file}${rank}` as Square;
    }
  }

  return null;
};

export const buildControllerState = ({
  game,
  lastMove,
  canUndo,
  canRedo,
}: {
  game: ChessInstance;
  lastMove: LastMove | null;
  canUndo: boolean;
  canRedo: boolean;
}): ChessControllerState => ({
  fen: game.fen(),
  turn: game.turn(),
  selectedSquare: null,
  legalMoves: [],
  lastMove,
  checkSquare: kingSquareForTurn(game),
  draggedSquare: null,
  dragOverSquare: null,
  movesSan: getMoveListSan(game),
  status: readStatus(game),
  canUndo,
  canRedo,
});
