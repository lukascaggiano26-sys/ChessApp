import type { CSSProperties, JSX } from 'react';
import { pieceGlyphByType } from './pieceGlyphs';
import type { ChessPieceProps } from './types';

const LIGHT_FILL = '#f3efdf';
const LIGHT_STROKE = '#131313';
const DARK_FILL = '#1a1a1a';
const DARK_STROKE = '#0b0b0b';

const sizeToCss = (size: number | string | undefined): string | number => {
  if (size === undefined) {
    return 64;
  }

  return typeof size === 'number' ? size : size;
};

export const ChessPiece = ({
  type,
  color,
  size = 64,
  className,
  selected = false,
  ghost = false,
  title,
}: ChessPieceProps): JSX.Element => {
  const Glyph = pieceGlyphByType[type];

  const fill = color === 'w' ? LIGHT_FILL : DARK_FILL;
  const stroke = color === 'w' ? LIGHT_STROKE : DARK_STROKE;
  const strokeWidth = color === 'w' ? 2.6 : 2.2;

  const style: CSSProperties = {
    width: sizeToCss(size),
    height: sizeToCss(size),
    display: 'inline-block',
    opacity: ghost ? 0.45 : 1,
    filter: selected ? 'drop-shadow(0 0 0.45rem rgba(255, 193, 7, 0.75))' : undefined,
    transform: ghost ? 'scale(0.96)' : undefined,
    transition: 'filter 120ms ease, opacity 120ms ease, transform 120ms ease',
    pointerEvents: ghost ? 'none' : undefined,
  };

  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 100 100"
      role="img"
      aria-label={title ?? `${color === 'w' ? 'white' : 'black'} ${type}`}
    >
      {title ? <title>{title}</title> : null}
      <Glyph fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  );
};
