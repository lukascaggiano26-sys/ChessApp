import type { BoardPiece, Square } from './types';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

const FEN_TO_TYPE = {
  p: 'p',
  n: 'n',
  b: 'b',
  r: 'r',
  q: 'q',
  k: 'k',
} as const;

const isFenPieceChar = (char: string): char is keyof typeof FEN_TO_TYPE => {
  return char.toLowerCase() in FEN_TO_TYPE;
};

export const squareFromIndices = (rankIndex: number, fileIndex: number): Square => {
  const file = FILES[fileIndex];
  const rank = RANKS[rankIndex];

  return `${file}${rank}`;
};

export const parseFenBoard = (fen: string): Map<Square, BoardPiece> => {
  const board = new Map<Square, BoardPiece>();
  const [placement] = fen.trim().split(/\s+/);

  if (!placement) {
    return board;
  }

  const rows = placement.split('/');

  if (rows.length !== 8) {
    return board;
  }

  for (let rankIndex = 0; rankIndex < 8; rankIndex += 1) {
    const row = rows[rankIndex];
    let fileIndex = 0;

    for (const char of row) {
      if (/^[1-8]$/.test(char)) {
        fileIndex += Number(char);
        continue;
      }

      if (!isFenPieceChar(char) || fileIndex > 7) {
        return new Map<Square, BoardPiece>();
      }

      const square = squareFromIndices(rankIndex, fileIndex);
      const lowered = char.toLowerCase() as keyof typeof FEN_TO_TYPE;

      board.set(square, {
        type: FEN_TO_TYPE[lowered],
        color: char === lowered ? 'b' : 'w',
      });

      fileIndex += 1;
    }

    if (fileIndex !== 8) {
      return new Map<Square, BoardPiece>();
    }
  }

  return board;
};

export const isDarkSquare = (square: Square): boolean => {
  const fileCode = square.charCodeAt(0) - 96;
  const rank = Number(square[1]);

  return (fileCode + rank) % 2 === 0;
};

export const allSquares = (): Square[] => {
  const squares: Square[] = [];

  for (let rankIndex = 0; rankIndex < 8; rankIndex += 1) {
    for (let fileIndex = 0; fileIndex < 8; fileIndex += 1) {
      squares.push(squareFromIndices(rankIndex, fileIndex));
    }
  }

  return squares;
};
