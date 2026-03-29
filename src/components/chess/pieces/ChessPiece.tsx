import type { CSSProperties, JSX } from 'react';
import type { ChessPieceProps } from './types';
import wK from './alpha/wK.svg?url';
import wQ from './alpha/wQ.svg?url';
import wR from './alpha/wR.svg?url';
import wB from './alpha/wB.svg?url';
import wN from './alpha/wN.svg?url';
import wP from './alpha/wP.svg?url';
import bK from './alpha/bK.svg?url';
import bQ from './alpha/bQ.svg?url';
import bR from './alpha/bR.svg?url';
import bB from './alpha/bB.svg?url';
import bN from './alpha/bN.svg?url';
import bP from './alpha/bP.svg?url';

const pieceSvgs: Record<string, string> = {
  wk: wK, wq: wQ, wr: wR, wb: wB, wn: wN, wp: wP,
  bk: bK, bq: bQ, br: bR, bb: bB, bn: bN, bp: bP,
};

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
  const src = pieceSvgs[`${color}${type}`];

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
    <img
      src={src}
      alt={title ?? `${color === 'w' ? 'white' : 'black'} ${type}`}
      className={className}
      style={style}
    />
  );
};
