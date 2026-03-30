import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { ChessPiece } from '../pieces';
import { allSquares, isDarkSquare, parseFenBoard } from './fen';
import type { ChessBoardProps, Square } from './types';
import { cn, createDisplaySquares, setDragPreviewFromPiece } from './boardViewUtils';
import './ChessBoard.css';

export const ChessBoard = ({
  fen,
  orientation = 'white',
  onSquareClick,
  selectedSquare = null,
  legalMoves = [],
  lastMove = null,
  checkSquare = null,
  draggedSquare = null,
  dragOverSquare = null,
  onPieceDragStart,
  onPieceDragEnter,
  onPieceDrop,
  onPieceDragEnd,
  className,
  pieceSizeRatio = 0.84,
  bestMoveArrow = null,
}: ChessBoardProps): JSX.Element => {
  const board = parseFenBoard(fen);
  const displaySquares = createDisplaySquares(orientation);
  const legalMoveSet = new Set(legalMoves);
  const lastMoveSet = new Set<Square>(lastMove ? [lastMove.from, lastMove.to] : []);
  const [coarsePointer, setCoarsePointer] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const media = window.matchMedia('(pointer: coarse)');
    const update = () => setCoarsePointer(media.matches);
    update();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  const draggingEnabled = Boolean(onPieceDragStart && onPieceDrop && onPieceDragEnd && !coarsePointer);

  const toBoardIndex = (square: Square): { fileIndex: number; rankIndex: number } => {
    const fileIndex = square.charCodeAt(0) - 97;
    const rankFromBottom = Number(square[1]) - 1;

    if (orientation === 'white') {
      return { fileIndex, rankIndex: 7 - rankFromBottom };
    }

    return { fileIndex: 7 - fileIndex, rankIndex: rankFromBottom };
  };

  const squareCenterPercent = (square: Square): { x: number; y: number } => {
    const { fileIndex, rankIndex } = toBoardIndex(square);
    return {
      x: (fileIndex + 0.5) * 12.5,
      y: (rankIndex + 0.5) * 12.5,
    };
  };

  const arrowFrom = bestMoveArrow ? squareCenterPercent(bestMoveArrow.from) : null;
  const arrowTo = bestMoveArrow ? squareCenterPercent(bestMoveArrow.to) : null;

  return (
    <div
      className={cn('chess-board', className)}
      style={{
        ['--piece-size-ratio' as string]: String(pieceSizeRatio),
      }}
    >
      {arrowFrom && arrowTo ? (
        <svg
          className="best-move-overlay"
          viewBox="0 0 100 100"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          <defs>
            <marker
              id="best-move-arrow-head"
              markerWidth="5"
              markerHeight="5"
              refX="4.2"
              refY="2.5"
              orient="auto"
            >
              <path d="M0,0 L5,2.5 L0,5 z" className="best-move-arrow-head" />
            </marker>
          </defs>
          <line
            x1={arrowFrom.x}
            y1={arrowFrom.y}
            x2={arrowTo.x}
            y2={arrowTo.y}
            className="best-move-arrow-line"
            markerEnd="url(#best-move-arrow-head)"
          />
        </svg>
      ) : null}

      {displaySquares.map((square, index) => {
        const piece = board.get(square);
        const file = square[0];
        const rank = square[1];
        const fileIndex = index % 8;
        const rankIndex = Math.floor(index / 8);
        const darkSquare = isDarkSquare(square);
        const showRankLabel = fileIndex === 0;
        const showFileLabel = rankIndex === 7;
        const isLegal = legalMoveSet.has(square);
        const isCaptureTarget = isLegal && Boolean(piece);

        return (
          <button
            key={square}
            type="button"
            className={cn(
              'chess-square',
              darkSquare ? 'is-dark' : 'is-light',
              onSquareClick && 'is-clickable',
              onSquareClick && 'is-hoverable',
              square === selectedSquare && 'is-selected',
              lastMoveSet.has(square) && 'is-last-move',
              square === checkSquare && 'is-check',
              square === dragOverSquare && 'is-drag-over',
            )}
            style={{
              ['--square-base' as string]: darkSquare ? 'var(--dark-square)' : 'var(--light-square)',
            }}
            onClick={() => onSquareClick?.(square)}
            aria-label={`Square ${square}`}
            onDragOver={(event) => {
              if (!draggingEnabled) {
                return;
              }
              event.preventDefault();
            }}
            onDragEnter={() => onPieceDragEnter?.(square)}
            onDrop={(event) => {
              if (!draggingEnabled) {
                return;
              }
              event.preventDefault();
              onPieceDrop?.(square);
            }}
          >
            {piece ? (
              <span
                draggable={draggingEnabled}
                className={cn(
                  'piece-wrap',
                  draggingEnabled && 'is-draggable',
                  draggedSquare === square && 'is-dragging',
                )}
                onDragStart={(event) => {
                  if (!draggingEnabled) {
                    return;
                  }
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', square);
                  setDragPreviewFromPiece(event);
                  onPieceDragStart?.(square);
                }}
                onDragEnd={() => onPieceDragEnd?.()}
              >
                <ChessPiece
                  type={piece.type}
                  color={piece.color}
                  size="100%"
                  ghost={draggedSquare === square}
                  selected={square === selectedSquare}
                  title={`${piece.color}-${piece.type}`}
                />
              </span>
            ) : null}

            {isLegal ? (
              <span className={cn('legal-indicator', isCaptureTarget ? 'capture' : 'dot')} />
            ) : null}

            {showRankLabel ? (
              <span className={cn('coord-label rank', darkSquare ? 'on-dark' : 'on-light')}>
                {rank}
              </span>
            ) : null}

            {showFileLabel ? (
              <span className={cn('coord-label file', darkSquare ? 'on-dark' : 'on-light')}>
                {file}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};

export const STARTING_POSITION_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const ChessBoardDemo = (): JSX.Element => {
  return (
    <ChessBoard
      fen={STARTING_POSITION_FEN}
      orientation="white"
      selectedSquare="e3"
      legalMoves={['d4', 'f4', 'g5', 'c5']}
      lastMove={{ from: 'd7', to: 'd5' }}
      checkSquare={null}
    />
  );
};

export const BOARD_SQUARES = allSquares();
