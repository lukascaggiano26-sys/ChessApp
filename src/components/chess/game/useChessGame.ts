import { Chess } from 'chess.js';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { LastMove, Square } from '../board';
import {
  asSquare,
  buildControllerState,
  getLegalDestinations,
  getMoveListSan,
  type ChessInstance,
  type ChessMove,
} from './chessAdapter';
import type { ChessControllerState, UseChessGameOptions } from './types';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const useChessGame = ({
  initialFen = START_FEN,
  onMove,
}: UseChessGameOptions = {}) => {
  const gameRef = useRef<ChessInstance>(new Chess(initialFen) as unknown as ChessInstance);
  // Lightweight redo: store forward FEN snapshots when undoing.
  const redoFenStackRef = useRef<string[]>([]);
  const lastMoveRef = useRef<LastMove | null>(null);

  const [state, setState] = useState<ChessControllerState>(() =>
    buildControllerState({ game: gameRef.current, lastMove: null, canUndo: false, canRedo: false }),
  );

  const syncState = useCallback(
    (nextLastMove: LastMove | null = lastMoveRef.current) => {
      lastMoveRef.current = nextLastMove;
      const nextState = buildControllerState({
        game: gameRef.current,
        lastMove: nextLastMove,
        canUndo: getMoveListSan(gameRef.current).length > 0,
        canRedo: redoFenStackRef.current.length > 0,
      });

      setState(nextState);
      onMove?.(nextState);
    },
    [onMove],
  );

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

      redoFenStackRef.current = [];
      syncState({ from: asSquare(result.from), to: asSquare(result.to) });
    },
    [clearSelection, syncState],
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

  const newGame = useCallback(() => {
    gameRef.current = new Chess(START_FEN) as unknown as ChessInstance;
    redoFenStackRef.current = [];
    syncState(null);
  }, [syncState]);

  const undoMove = useCallback(() => {
    const currentFen = gameRef.current.fen();
    const undone = gameRef.current.undo();
    if (!undone) {
      return;
    }

    redoFenStackRef.current.push(currentFen);

    const history = gameRef.current.history({ verbose: true }) as ChessMove[];
    const prior = history.at(-1);
    syncState(prior ? { from: asSquare(prior.from), to: asSquare(prior.to) } : null);
  }, [syncState]);

  const redoMove = useCallback(() => {
    const redoFen = redoFenStackRef.current.pop();
    if (!redoFen) {
      return;
    }

    const loaded = gameRef.current.load(redoFen);
    if (!loaded) {
      return;
    }

    const history = gameRef.current.history({ verbose: true }) as ChessMove[];
    const latest = history.at(-1);
    syncState(latest ? { from: asSquare(latest.from), to: asSquare(latest.to) } : null);
  }, [syncState]);

  const loadFen = useCallback(
    (fen: string): boolean => {
      const loaded = gameRef.current.load(fen.trim());
      if (!loaded) {
        return false;
      }

      redoFenStackRef.current = [];
      syncState(null);
      return true;
    },
    [syncState],
  );

  const reset = useCallback(
    (fen: string = initialFen) => {
      const loaded = gameRef.current.load(fen);
      if (!loaded) {
        gameRef.current = new Chess(initialFen) as unknown as ChessInstance;
      }
      redoFenStackRef.current = [];
      syncState(null);
    },
    [initialFen, syncState],
  );

  return useMemo(
    () => ({
      ...state,
      onSquareClick,
      onPieceDragStart,
      onPieceDragEnter,
      onPieceDrop,
      onPieceDragEnd,
      newGame,
      undoMove,
      redoMove,
      loadFen,
      reset,
      getGame: () => gameRef.current,
    }),
    [
      loadFen,
      newGame,
      onPieceDragEnd,
      onPieceDragEnter,
      onPieceDragStart,
      onPieceDrop,
      onSquareClick,
      redoMove,
      reset,
      state,
      undoMove,
    ],
  );
};
