import type { DragEvent, JSX } from 'react';
import { ChessPiece } from '../pieces';
import { allSquares, isDarkSquare, parseFenBoard } from './fen';
import type { ChessBoardProps, Square } from './types';
import './ChessBoard.css';

const FILES_WHITE: Square['0'][] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const FILES_BLACK: Square['0'][] = ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
const RANKS_WHITE: Square['1'][] = ['8', '7', '6', '5', '4', '3', '2', '1'];
const RANKS_BLACK: Square['1'][] = ['1', '2', '3', '4', '5', '6', '7', '8'];

const createDisplaySquares = (orientation: 'white' | 'black'): Square[] => {
  const files = orientation === 'white' ? FILES_WHITE : FILES_BLACK;
  const ranks = orientation === 'white' ? RANKS_WHITE : RANKS_BLACK;

  return ranks.flatMap((rank) => files.map((file) => `${file}${rank}` as Square));
};

const cn = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(' ');

const setDragPreview = (event: DragEvent<HTMLElement>): void => {
  const svg = event.currentTarget.querySelector('svg');
  if (!svg) {
    return;
  }

  const ghost = document.createElement('div');
  ghost.style.position = 'fixed';
  ghost.style.top = '-1000px';
  ghost.style.left = '-1000px';
  ghost.style.width = '58px';
  ghost.style.height = '58px';
  ghost.style.pointerEvents = 'none';

  const clonedSvg = svg.cloneNode(true) as SVGElement;
  clonedSvg.style.width = '58px';
  clonedSvg.style.height = '58px';
  clonedSvg.style.opacity = '0.9';
  ghost.appendChild(clonedSvg);

  document.body.appendChild(ghost);
  event.dataTransfer.setDragImage(ghost, 29, 29);

  window.setTimeout(() => {
    ghost.remove();
  }, 0);
};

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
}: ChessBoardProps): JSX.Element => {
  const board = parseFenBoard(fen);
  const displaySquares = createDisplaySquares(orientation);
  const legalMoveSet = new Set(legalMoves);
  const lastMoveSet = new Set<Square>(lastMove ? [lastMove.from, lastMove.to] : []);
  const draggingEnabled = Boolean(onPieceDragStart && onPieceDrop && onPieceDragEnd);

  return (
    <div
      className={cn('chess-board', className)}
      style={{
        ['--piece-size-ratio' as string]: String(pieceSizeRatio),
      }}
    >
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
                  setDragPreview(event);
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
