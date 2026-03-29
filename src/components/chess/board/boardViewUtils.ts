import type { DragEvent } from 'react';
import type { Square } from './types';

const FILES_WHITE: Square['0'][] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const FILES_BLACK: Square['0'][] = ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
const RANKS_WHITE: Square['1'][] = ['8', '7', '6', '5', '4', '3', '2', '1'];
const RANKS_BLACK: Square['1'][] = ['1', '2', '3', '4', '5', '6', '7', '8'];

export const createDisplaySquares = (orientation: 'white' | 'black'): Square[] => {
  const files = orientation === 'white' ? FILES_WHITE : FILES_BLACK;
  const ranks = orientation === 'white' ? RANKS_WHITE : RANKS_BLACK;

  return ranks.flatMap((rank) => files.map((file) => `${file}${rank}` as Square));
};

export const cn = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(' ');

export const setDragPreviewFromPiece = (event: DragEvent<HTMLElement>): void => {
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
