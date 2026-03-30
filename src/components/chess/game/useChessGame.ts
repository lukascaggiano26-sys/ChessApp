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

type LineData = {
  fens: string[];
  lastMoves: Array<LastMove | null>;
  sanMoves: string[];
};

type DeviationLine = {
  rootIndex: number;
  fens: string[];
  lastMoves: Array<LastMove | null>;
  sanMoves: string[];
  currentIndex: number;
};

type MoveTimeline = {
  main: LineData;
  currentIndex: number;
  deviation: DeviationLine | null;
};

const createLineData = (startingFen: string): LineData => ({
  fens: [startingFen],
  lastMoves: [null],
  sanMoves: [],
});

export const useChessGame = ({
  initialFen = START_FEN,
  onMove,
}: UseChessGameOptions = {}) => {
  const gameRef = useRef<ChessInstance>(new Chess(initialFen) as unknown as ChessInstance);
  const timelineRef = useRef<MoveTimeline>({
    main: createLineData(gameRef.current.fen()),
    currentIndex: 0,
    deviation: null,
  });

  const [state, setState] = useState<ChessControllerState>(() =>
    buildControllerState({
      game: gameRef.current,
      startingFen: timelineRef.current.main.fens[0],
      currentPly: 0,
      lastMove: null,
      canUndo: false,
      canRedo: false,
    }),
  );

  const syncState = useCallback(() => {
    const timeline = timelineRef.current;
    const activeDeviation = timeline.deviation;

    const currentPly = activeDeviation
      ? activeDeviation.rootIndex + activeDeviation.currentIndex
      : timeline.currentIndex;

    const movesSan = activeDeviation
      ? [
          ...timeline.main.sanMoves.slice(0, activeDeviation.rootIndex),
          ...activeDeviation.sanMoves.slice(0, activeDeviation.currentIndex),
        ]
      : timeline.main.sanMoves.slice(0, timeline.currentIndex);

    const lastMove = activeDeviation
      ? activeDeviation.currentIndex === 0
        ? timeline.main.lastMoves[activeDeviation.rootIndex]
        : activeDeviation.lastMoves[activeDeviation.currentIndex]
      : timeline.main.lastMoves[timeline.currentIndex];

    const canRedo = activeDeviation
      ? activeDeviation.currentIndex === 0
        ? activeDeviation.rootIndex < timeline.main.fens.length - 1
        : activeDeviation.currentIndex < activeDeviation.fens.length - 1
      : timeline.currentIndex < timeline.main.fens.length - 1;

    const nextState = buildControllerState({
      game: gameRef.current,
      startingFen: timeline.main.fens[0],
      currentPly,
      lastMove,
      canUndo: currentPly > 0,
      canRedo,
      movesSan,
    });

    setState(nextState);
    onMove?.(nextState);
  }, [onMove]);

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

      const timeline = timelineRef.current;
      const nextLastMove = { from: asSquare(result.from), to: asSquare(result.to) };
      const nextFen = gameRef.current.fen();
      const nextSan = String(result.san);

      if (timeline.deviation) {
        const nextIndex = timeline.deviation.currentIndex + 1;
        timeline.deviation.fens = [...timeline.deviation.fens.slice(0, nextIndex), nextFen];
        timeline.deviation.lastMoves = [...timeline.deviation.lastMoves.slice(0, nextIndex), nextLastMove];
        timeline.deviation.sanMoves = [...timeline.deviation.sanMoves.slice(0, nextIndex - 1), nextSan];
        timeline.deviation.currentIndex = nextIndex;
      } else {
        const nextIndex = timeline.currentIndex + 1;
        if (timeline.currentIndex < timeline.main.fens.length - 1) {
          timeline.deviation = {
            rootIndex: timeline.currentIndex,
            fens: [timeline.main.fens[timeline.currentIndex], nextFen],
            lastMoves: [timeline.main.lastMoves[timeline.currentIndex], nextLastMove],
            sanMoves: [nextSan],
            currentIndex: 1,
          };
        } else {
          timeline.main.fens = [...timeline.main.fens.slice(0, nextIndex), nextFen];
          timeline.main.lastMoves = [...timeline.main.lastMoves.slice(0, nextIndex), nextLastMove];
          timeline.main.sanMoves = [...timeline.main.sanMoves.slice(0, nextIndex - 1), nextSan];
          timeline.currentIndex = nextIndex;
        }
      }

      syncState();
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
      main: createLineData(fen),
      currentIndex: 0,
      deviation: null,
    };
  }, []);

  const newGame = useCallback(() => {
    gameRef.current = new Chess(START_FEN) as unknown as ChessInstance;
    resetTimeline(gameRef.current.fen());
    syncState();
  }, [resetTimeline, syncState]);

  const undoMove = useCallback(() => {
    const timeline = timelineRef.current;

    if (timeline.deviation) {
      if (timeline.deviation.currentIndex > 0) {
        timeline.deviation.currentIndex -= 1;
        const fen =
          timeline.deviation.currentIndex === 0
            ? timeline.main.fens[timeline.deviation.rootIndex]
            : timeline.deviation.fens[timeline.deviation.currentIndex];
        gameRef.current.load(fen);
        syncState();
        return;
      }

      timeline.currentIndex = timeline.deviation.rootIndex;
      timeline.deviation = null;
    }

    if (timeline.currentIndex === 0) {
      return;
    }

    timeline.currentIndex -= 1;
    gameRef.current.load(timeline.main.fens[timeline.currentIndex]);
    syncState();
  }, [syncState]);

  const redoMove = useCallback(() => {
    const timeline = timelineRef.current;

    if (timeline.deviation) {
      if (timeline.deviation.currentIndex === 0) {
        timeline.currentIndex = timeline.deviation.rootIndex;
        timeline.deviation = null;
      } else if (timeline.deviation.currentIndex < timeline.deviation.fens.length - 1) {
        timeline.deviation.currentIndex += 1;
        gameRef.current.load(timeline.deviation.fens[timeline.deviation.currentIndex]);
        syncState();
        return;
      } else {
        return;
      }
    }

    if (timeline.currentIndex >= timeline.main.fens.length - 1) {
      return;
    }

    timeline.currentIndex += 1;
    gameRef.current.load(timeline.main.fens[timeline.currentIndex]);
    syncState();
  }, [syncState]);

  const jumpToPly = useCallback(
    (plyIndex: number) => {
      const timeline = timelineRef.current;
      const mainMax = timeline.main.fens.length - 1;
      const clampedPly = Math.max(0, Math.min(plyIndex, mainMax));

      if (timeline.deviation) {
        const root = timeline.deviation.rootIndex;
        const devMax = root + timeline.deviation.fens.length - 1;

        if (clampedPly > root && clampedPly <= devMax) {
          timeline.deviation.currentIndex = clampedPly - root;
          gameRef.current.load(timeline.deviation.fens[timeline.deviation.currentIndex]);
          syncState();
          return;
        }

        timeline.deviation = null;
      }

      if (clampedPly === timeline.currentIndex) {
        return;
      }

      timeline.currentIndex = clampedPly;
      gameRef.current.load(timeline.main.fens[clampedPly]);
      syncState();
    },
    [syncState],
  );

  const loadFen = useCallback(
    (fen: string): boolean => {
      const loaded = gameRef.current.load(fen.trim());
      if (!loaded) {
        return false;
      }

      resetTimeline(gameRef.current.fen());
      syncState();
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
        const main: LineData = {
          fens: [replayGame.fen()],
          lastMoves: [null],
          sanMoves: [],
        };

        for (const move of verboseMoves) {
          if (typeof move === 'string') {
            continue;
          }

          const appliedMove = replayGame.move(move.san);
          if (!appliedMove) {
            return false;
          }

          main.fens.push(replayGame.fen());
          main.lastMoves.push({ from: asSquare(appliedMove.from), to: asSquare(appliedMove.to) });
          main.sanMoves.push(String(appliedMove.san ?? move.san));
        }

        gameRef.current = new Chess(main.fens[0]) as unknown as ChessInstance;
        timelineRef.current = {
          main,
          currentIndex: 0,
          deviation: null,
        };

        syncState();
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
      syncState();
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
      jumpToPly,
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
      jumpToPly,
      reset,
      state,
      undoMove,
    ],
  );
};
