import type { JSX } from 'react';
import { ChessPiece } from './ChessPiece';
import type { PieceColor, PieceType } from './types';

const PIECE_TYPES: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];
const PIECE_COLORS: PieceColor[] = ['w', 'b'];

export const ChessPieceDemo = (): JSX.Element => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, minmax(56px, 72px))',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'start',
      }}
    >
      {PIECE_COLORS.map((color) =>
        PIECE_TYPES.map((type, index) => (
          <ChessPiece
            key={`${color}-${type}`}
            color={color}
            type={type}
            size={64}
            selected={color === 'w' && type === 'k'}
            ghost={color === 'b' && type === 'n' && index === 4}
            title={`${color}-${type}`}
          />
        )),
      )}
    </div>
  );
};
