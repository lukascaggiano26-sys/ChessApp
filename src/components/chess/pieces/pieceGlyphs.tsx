import type { JSX } from 'react';
import type { PieceType } from './types';

interface GlyphProps {
  fill: string;
  stroke: string;
  strokeWidth: number;
}

const PawnGlyph = ({ fill, stroke, strokeWidth }: GlyphProps): JSX.Element => (
  <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round">
    <circle cx="50" cy="23" r="10" />
    <path d="M50 34c-10 0-17 8-17 17 0 2 0 5 2 8l-4 9h38l-4-9c1-3 2-6 2-8 0-9-7-17-17-17Z" />
    <path d="M31 71h38v10H31z" />
  </g>
);

const RookGlyph = ({ fill, stroke, strokeWidth }: GlyphProps): JSX.Element => (
  <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round">
    <path d="M28 20h8v8h8v-8h12v8h8v-8h8v16H28z" />
    <path d="M32 36h36l-2 30H34z" />
    <path d="M28 68h44v8H28z" />
    <path d="M24 76h52v10H24z" />
  </g>
);

const BishopGlyph = ({ fill, stroke, strokeWidth }: GlyphProps): JSX.Element => (
  <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round">
    <path d="M50 16c8 0 14 6 14 13 0 5-3 9-7 13l-3 3 4 7c4 8 4 8 4 15H38c0-7 0-7 4-15l4-7-3-3c-4-4-7-8-7-13 0-7 6-13 14-13Z" />
    <path d="M45 30l10 10" />
    <path d="M33 67h34v9H33z" />
    <path d="M25 76h50v10H25z" />
    <circle cx="50" cy="11" r="4" />
  </g>
);

const KnightGlyph = ({ fill, stroke, strokeWidth }: GlyphProps): JSX.Element => (
  <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round">
    <path d="M70 76H30c2-8 5-15 8-20 3-6 5-11 6-16-4 0-9-3-9-9 0-9 8-15 20-15 11 0 19 5 19 14 0 6-3 10-6 13-2 2-4 4-5 7 4 1 7 5 7 10 0 5-2 10-5 16Z" />
    <path d="M44 32c5-2 11-1 15 3" fill="none" />
    <circle cx="52" cy="27" r="2.5" />
    <path d="M30 76h40v10H30z" />
    <path d="M24 86h52v8H24z" />
  </g>
);

const QueenGlyph = ({ fill, stroke, strokeWidth }: GlyphProps): JSX.Element => (
  <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round">
    <circle cx="30" cy="20" r="4" />
    <circle cx="44" cy="14" r="4" />
    <circle cx="56" cy="14" r="4" />
    <circle cx="70" cy="20" r="4" />
    <path d="M28 23l8 24h28l8-24-10 8-8-13-8 13-8-13Z" />
    <path d="M34 47h32l4 19H30z" />
    <path d="M30 66h40v9H30z" />
    <path d="M24 75h52v11H24z" />
  </g>
);

const KingGlyph = ({ fill, stroke, strokeWidth }: GlyphProps): JSX.Element => (
  <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round">
    <path d="M50 12v16" />
    <path d="M42 20h16" />
    <path d="M50 30c10 0 18 7 18 16 0 4-2 8-5 11-2 2-3 4-3 6H40c0-2-1-4-3-6-3-3-5-7-5-11 0-9 8-16 18-16Z" />
    <path d="M32 50c0-8 8-14 18-14s18 6 18 14" fill="none" />
    <path d="M31 63h38v9H31z" />
    <path d="M25 72h50v12H25z" />
  </g>
);

export const pieceGlyphByType: Record<PieceType, (props: GlyphProps) => JSX.Element> = {
  p: PawnGlyph,
  n: KnightGlyph,
  b: BishopGlyph,
  r: RookGlyph,
  q: QueenGlyph,
  k: KingGlyph,
};
