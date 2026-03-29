import type { CSSProperties, JSX } from 'react';
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
}: {
  square: Square;
  selectedSquare: Square | null;
  legalMoveSet: Set<Square>;
  lastMoveSet: Set<Square>;
  checkSquare: Square | null;
}): string | undefined => {
  if (square === selectedSquare) {
    return SELECTED_OVERLAY;
  }

  if (square === checkSquare) {
    return CHECK_OVERLAY;
  }

  if (lastMoveSet.has(square)) {
    return LAST_MOVE_OVERLAY;
  }

  if (legalMoveSet.has(square)) {
    return 'rgba(59, 130, 246, 0.20)';
  }

  return undefined;
};

export const ChessBoard = ({
  fen,
  orientation = 'white',
  onSquareClick,
  selectedSquare = null,
  legalMoves = [],
  lastMove = null,
  checkSquare = null,
  className,
  pieceSizeRatio = 0.84,
}: ChessBoardProps): JSX.Element => {
  const board = parseFenBoard(fen);
  const displaySquares = createDisplaySquares(orientation);
  const legalMoveSet = new Set(legalMoves);
  const lastMoveSet = new Set<Square>(lastMove ? [lastMove.from, lastMove.to] : []);

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
        };

        return (
          <button
            key={square}
            type="button"
            style={squareStyle}
            onClick={() => onSquareClick?.(square)}
            aria-label={`Square ${square}`}
          >
            {piece ? (
              <ChessPiece
                type={piece.type}
                color={piece.color}
                size={`${pieceSizeRatio * 100}%`}
                title={`${piece.color}-${piece.type}`}
              />
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
