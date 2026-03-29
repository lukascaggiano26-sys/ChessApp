import type { CSSProperties, DragEvent, JSX } from 'react';
import { ChessPiece } from '../pieces';
import { allSquares, isDarkSquare, parseFenBoard } from './fen';
import type { ChessBoardProps, Square } from './types';

const LIGHT_SQUARE = '#f0d9b5';
const DARK_SQUARE = '#b58863';
const SELECTED_OVERLAY = 'rgba(252, 211, 77, 0.55)';
const LEGAL_MOVE_DOT = 'rgba(20, 20, 20, 0.35)';
const LAST_MOVE_OVERLAY = 'rgba(110, 231, 183, 0.36)';
const CHECK_OVERLAY = 'rgba(239, 68, 68, 0.6)';

const FILES_WHITE: Square['0'][] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const FILES_BLACK: Square['0'][] = ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
const RANKS_WHITE: Square['1'][] = ['8', '7', '6', '5', '4', '3', '2', '1'];
const RANKS_BLACK: Square['1'][] = ['1', '2', '3', '4', '5', '6', '7', '8'];

const createDisplaySquares = (orientation: 'white' | 'black'): Square[] => {
  const files = orientation === 'white' ? FILES_WHITE : FILES_BLACK;
  const ranks = orientation === 'white' ? RANKS_WHITE : RANKS_BLACK;

  return ranks.flatMap((rank) => files.map((file) => `${file}${rank}` as Square));
};

const buildSquareOverlay = ({
  square,
  selectedSquare,
  legalMoveSet,
  lastMoveSet,
  checkSquare,
  dragOverSquare,
}: {
  square: Square;
  selectedSquare: Square | null;
  legalMoveSet: Set<Square>;
  lastMoveSet: Set<Square>;
  checkSquare: Square | null;
  dragOverSquare: Square | null;
}): string | undefined => {
  if (square === selectedSquare) {
    return SELECTED_OVERLAY;
  }

  if (square === checkSquare) {
    return CHECK_OVERLAY;
  }

  if (square === dragOverSquare && legalMoveSet.has(square)) {
    return 'rgba(96, 165, 250, 0.38)';
  }

  if (lastMoveSet.has(square)) {
    return LAST_MOVE_OVERLAY;
  }

  if (legalMoveSet.has(square)) {
    return 'rgba(59, 130, 246, 0.20)';
  }

  return undefined;
};

const setDragPreview = (event: DragEvent<HTMLElement>): void => {
  const svg = event.currentTarget.querySelector('svg');
  if (!svg) {
    return;
  }

  const ghost = document.createElement('div');
  ghost.style.position = 'fixed';
  ghost.style.top = '-1000px';
  ghost.style.left = '-1000px';
  ghost.style.width = '56px';
  ghost.style.height = '56px';
  ghost.style.pointerEvents = 'none';

  const clonedSvg = svg.cloneNode(true) as SVGElement;
  clonedSvg.style.width = '56px';
  clonedSvg.style.height = '56px';
  clonedSvg.style.opacity = '0.85';
  ghost.appendChild(clonedSvg);

  document.body.appendChild(ghost);
  event.dataTransfer.setDragImage(ghost, 28, 28);

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
      className={className}
      style={{
        width: '100%',
        maxWidth: 720,
        aspectRatio: '1 / 1',
        display: 'grid',
        gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
        border: '1px solid #111827',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {displaySquares.map((square, index) => {
        const piece = board.get(square);
        const file = square[0];
        const rank = square[1];
        const fileIndex = index % 8;
        const rankIndex = Math.floor(index / 8);
        const background = isDarkSquare(square) ? DARK_SQUARE : LIGHT_SQUARE;
        const overlay = buildSquareOverlay({
          square,
          selectedSquare,
          legalMoveSet,
          lastMoveSet,
          checkSquare,
          dragOverSquare,
        });

        const labelColor = isDarkSquare(square) ? '#fef3c7' : '#7c2d12';
        const showRankLabel = fileIndex === 0;
        const showFileLabel = rankIndex === 7;
        const isLegal = legalMoveSet.has(square);

        const squareStyle: CSSProperties = {
          position: 'relative',
          backgroundColor: overlay ?? background,
          cursor: onSquareClick ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          border: 'none',
          padding: 0,
        };

        return (
          <button
            key={square}
            type="button"
            style={squareStyle}
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
                style={{
                  width: `${pieceSizeRatio * 100}%`,
                  height: `${pieceSizeRatio * 100}%`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: draggedSquare === square ? 0.25 : 1,
                  cursor: draggingEnabled ? 'grab' : 'inherit',
                }}
              >
                <ChessPiece
                  type={piece.type}
                  color={piece.color}
                  size="100%"
                  ghost={draggedSquare === square}
                  title={`${piece.color}-${piece.type}`}
                />
              </span>
            ) : null}

            {isLegal ? (
              <span
                style={{
                  position: 'absolute',
                  width: piece ? '70%' : '26%',
                  height: piece ? '70%' : '26%',
                  border: piece ? `4px solid ${LEGAL_MOVE_DOT}` : undefined,
                  borderRadius: '50%',
                  background: piece ? 'transparent' : LEGAL_MOVE_DOT,
                  pointerEvents: 'none',
                }}
              />
            ) : null}

            {showRankLabel ? (
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 5,
                  color: labelColor,
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1,
                  pointerEvents: 'none',
                }}
              >
                {rank}
              </span>
            ) : null}

            {showFileLabel ? (
              <span
                style={{
                  position: 'absolute',
                  bottom: 4,
                  right: 5,
                  color: labelColor,
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1,
                  pointerEvents: 'none',
                }}
              >
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
