import { Chess } from 'chess.js';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { LastMove, Square } from '../board';
import {
  asSquare,
  buildControllerState,
  getLegalDestinations,
  type ChessInstance,
} from './chessAdapter';
import type { ChessControllerState, UseChessGameOptions } from './types';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const parseFenHeaderFromPgn = (pgn: string): string | null => {
  const match = /\[FEN\s+"([^"]+)"\]/i.exec(pgn);
  return match?.[1] ?? null;
};

type MoveTimeline = {
  fens: string[];
  lastMoves: Array<LastMove | null>;
  currentIndex: number;
};

export const useChessGame = ({
  initialFen = START_FEN,
  onMove,
}: UseChessGameOptions = {}) => {
  const gameRef = useRef<ChessInstance>(new Chess(initialFen) as unknown as ChessInstance);
  const timelineRef = useRef<MoveTimeline>({
    fens: [gameRef.current.fen()],
    lastMoves: [null],
    currentIndex: 0,
  });

  const [state, setState] = useState<ChessControllerState>(() =>
    buildControllerState({ game: gameRef.current, lastMove: null, canUndo: false, canRedo: false }),
  );

  const syncState = useCallback(
    (nextLastMove: LastMove | null = timelineRef.current.lastMoves[timelineRef.current.currentIndex]) => {
      const nextState = buildControllerState({
        game: gameRef.current,
        lastMove: nextLastMove,
        canUndo: timelineRef.current.currentIndex > 0,
        canRedo: timelineRef.current.currentIndex < timelineRef.current.fens.length - 1,
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

      const nextLastMove = { from: asSquare(result.from), to: asSquare(result.to) };
      const nextFen = gameRef.current.fen();
      const nextIndex = timelineRef.current.currentIndex + 1;

      timelineRef.current.fens = [...timelineRef.current.fens.slice(0, nextIndex), nextFen];
      timelineRef.current.lastMoves = [...timelineRef.current.lastMoves.slice(0, nextIndex), nextLastMove];
      timelineRef.current.currentIndex = nextIndex;

      syncState(nextLastMove);
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

  const resetTimeline = useCallback((fen: string) => {
    timelineRef.current = {
      fens: [fen],
      lastMoves: [null],
      currentIndex: 0,
    };
  }, []);

  const newGame = useCallback(() => {
    gameRef.current = new Chess(START_FEN) as unknown as ChessInstance;
    resetTimeline(gameRef.current.fen());
    syncState(null);
  }, [resetTimeline, syncState]);

  const undoMove = useCallback(() => {
    if (timelineRef.current.currentIndex === 0) {
      return;
    }

    const previousIndex = timelineRef.current.currentIndex - 1;
    const previousFen = timelineRef.current.fens[previousIndex];
    gameRef.current.load(previousFen);
    timelineRef.current.currentIndex = previousIndex;

    syncState();
  }, [syncState]);

  const redoMove = useCallback(() => {
    if (timelineRef.current.currentIndex >= timelineRef.current.fens.length - 1) {
      return;
    }

    const nextIndex = timelineRef.current.currentIndex + 1;
    const nextFen = timelineRef.current.fens[nextIndex];
    gameRef.current.load(nextFen);
    timelineRef.current.currentIndex = nextIndex;

    syncState();
  }, [syncState]);

  const loadFen = useCallback(
    (fen: string): boolean => {
      const loaded = gameRef.current.load(fen.trim());
      if (!loaded) {
        return false;
      }

      resetTimeline(gameRef.current.fen());
      syncState(null);
      return true;
    },
    [resetTimeline, syncState],
  );

  const loadPgn = useCallback(
    (pgn: string): boolean => {
      try {
        const startingFen = parseFenHeaderFromPgn(pgn) ?? START_FEN;
        const validator = new Chess(startingFen);
        validator.loadPgn(pgn);

        const replayGame = new Chess(startingFen);
        const verboseMoves = validator.history({ verbose: true });
        const fens: string[] = [replayGame.fen()];
        const lastMoves: Array<LastMove | null> = [null];

        for (const move of verboseMoves) {
          if (typeof move === 'string') {
            continue;
          }

          const appliedMove = replayGame.move(move.san);
          if (!appliedMove) {
            return false;
          }

          fens.push(replayGame.fen());
          lastMoves.push({ from: asSquare(appliedMove.from), to: asSquare(appliedMove.to) });
        }

        gameRef.current = new Chess(fens[0]) as unknown as ChessInstance;
        timelineRef.current = {
          fens,
          lastMoves,
          currentIndex: 0,
        };

        syncState(null);
        return true;
      } catch {
        return false;
      }
    },
    [syncState],
  );

  const reset = useCallback(
    (fen: string = initialFen) => {
      const loaded = gameRef.current.load(fen);
      if (!loaded) {
        gameRef.current = new Chess(initialFen) as unknown as ChessInstance;
      }

      resetTimeline(gameRef.current.fen());
      syncState(null);
    },
    [initialFen, resetTimeline, syncState],
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
      loadPgn,
      reset,
      getGame: () => gameRef.current,
    }),
    [
      loadFen,
      loadPgn,
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
