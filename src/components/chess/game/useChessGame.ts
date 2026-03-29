import { Chess } from 'chess.js';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { LastMove, Square } from '../board';
import type { ChessControllerState, UseChessGameOptions } from './types';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

type ChessMove = {
  from: string;
  to: string;
};

type ChessInstance = {
  fen: () => string;
  turn: () => 'w' | 'b';
  get: (square: string) => { type: string; color: 'w' | 'b' } | null;
  moves: (options?: { square?: string; verbose?: boolean }) => Array<string | ChessMove>;
  move: (move: { from: string; to: string; promotion?: 'q' | 'r' | 'b' | 'n' }) => ChessMove | null;
  board: () => Array<Array<{ type: string; color: 'w' | 'b' } | null>>;
  isCheck: () => boolean;
  inCheck?: () => boolean;
};

const asSquare = (value: string): Square => value as Square;

const buildInitialState = (game: ChessInstance): ChessControllerState => ({
  fen: game.fen(),
  turn: game.turn(),
  selectedSquare: null,
  legalMoves: [],
  lastMove: null,
  checkSquare: null,
  draggedSquare: null,
  dragOverSquare: null,
});

const getLegalDestinations = (game: ChessInstance, from: Square): Square[] => {
  const moves = game.moves({ square: from, verbose: true });

  return moves
    .map((move) => (typeof move === 'string' ? null : move.to))
    .filter((destination): destination is string => Boolean(destination))
    .map(asSquare);
};

const kingSquareForTurn = (game: ChessInstance): Square | null => {
  const sideToMove = game.turn();
  const isInCheck = typeof game.isCheck === 'function' ? game.isCheck() : game.inCheck?.() ?? false;

  if (!isInCheck) {
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

export const useChessGame = ({
  initialFen = START_FEN,
  onMove,
}: UseChessGameOptions = {}) => {
  const gameRef = useRef<ChessInstance>(new Chess(initialFen) as unknown as ChessInstance);
  const [state, setState] = useState<ChessControllerState>(() => buildInitialState(gameRef.current));

  const clearSelection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedSquare: null,
      legalMoves: [],
      draggedSquare: null,
      dragOverSquare: null,
    }));
  }, []);

  const selectSquare = useCallback((selectedSquare: Square) => {
    const legalMoves = getLegalDestinations(gameRef.current, selectedSquare);
    setState((prev) => ({ ...prev, selectedSquare, legalMoves }));
  }, []);

  const applyMove = useCallback(
    (from: Square, to: Square) => {
      const result = gameRef.current.move({ from, to, promotion: 'q' });
      if (!result) {
        clearSelection();
        return;
      }

      const nextState: ChessControllerState = {
        fen: gameRef.current.fen(),
        turn: gameRef.current.turn(),
        selectedSquare: null,
        legalMoves: [],
        lastMove: { from: asSquare(result.from), to: asSquare(result.to) } satisfies LastMove,
        checkSquare: kingSquareForTurn(gameRef.current),
        draggedSquare: null,
        dragOverSquare: null,
      };

      setState(nextState);
      onMove?.(nextState);
    },
    [clearSelection, onMove],
  );

  const onSquareClick = useCallback(
    (square: Square) => {
      const selected = state.selectedSquare;

      if (selected && square === selected) {
        clearSelection();
        return;
      }

      if (selected) {
        if (state.legalMoves.includes(square)) {
          applyMove(selected, square);
          return;
        }

        const clickedPiece = gameRef.current.get(square);
        if (clickedPiece && clickedPiece.color === gameRef.current.turn()) {
          selectSquare(square);
          return;
        }

        clearSelection();
        return;
      }

      const piece = gameRef.current.get(square);
      if (piece && piece.color === gameRef.current.turn()) {
        selectSquare(square);
        return;
      }

      clearSelection();
    },
    [applyMove, clearSelection, selectSquare, state.legalMoves, state.selectedSquare],
  );

  const onPieceDragStart = useCallback(
    (square: Square) => {
      const piece = gameRef.current.get(square);
      if (!piece || piece.color !== gameRef.current.turn()) {
        clearSelection();
        return;
      }

      const legalMoves = getLegalDestinations(gameRef.current, square);
      if (!legalMoves.length) {
        clearSelection();
        return;
      }

      setState((prev) => ({
        ...prev,
        selectedSquare: square,
        legalMoves,
        draggedSquare: square,
        dragOverSquare: null,
      }));
    },
    [clearSelection],
  );

  const onPieceDragEnter = useCallback((square: Square) => {
    setState((prev) => {
      if (!prev.draggedSquare) {
        return prev;
      }

      return {
        ...prev,
        dragOverSquare: prev.legalMoves.includes(square) ? square : null,
      };
    });
  }, []);

  const onPieceDrop = useCallback(
    (square: Square) => {
      const from = state.draggedSquare;
      if (!from) {
        return;
      }

      if (!state.legalMoves.includes(square)) {
        clearSelection();
        return;
      }

      applyMove(from, square);
    },
    [applyMove, clearSelection, state.draggedSquare, state.legalMoves],
  );

  const onPieceDragEnd = useCallback(() => {
    setState((prev) => ({
      ...prev,
      draggedSquare: null,
      dragOverSquare: null,
    }));
  }, []);

  const reset = useCallback(
    (fen: string = initialFen) => {
      gameRef.current = new Chess(fen) as unknown as ChessInstance;
      setState(buildInitialState(gameRef.current));
    },
    [initialFen],
  );

  return useMemo(
    () => ({
      ...state,
      onSquareClick,
      onPieceDragStart,
      onPieceDragEnter,
      onPieceDrop,
      onPieceDragEnd,
      reset,
      getGame: () => gameRef.current,
    }),
    [onPieceDragEnd, onPieceDragEnter, onPieceDragStart, onPieceDrop, onSquareClick, reset, state],
  );
};
