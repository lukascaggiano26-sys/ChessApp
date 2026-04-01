import type { MoveLabel } from './moveReviewTypes';

export const normalizeUciForBestBoundary = (uci: string | null): string | null => {
  if (!uci) {
    return null;
  }

  const normalized = uci.trim().toLowerCase();
  return normalized.length >= 4 ? normalized : null;
};

export const isPlayedMoveEqualToEngineBest = (playedUci: string, bestUci: string | null): boolean => {
  const normalizedPlayed = normalizeUciForBestBoundary(playedUci);
  const normalizedBest = normalizeUciForBestBoundary(bestUci);
  return Boolean(normalizedPlayed && normalizedBest && normalizedPlayed === normalizedBest);
};

export const enforceBestLabelBoundary = ({
  baseLabel,
  playedUci,
  bestMoveUci,
}: {
  baseLabel: MoveLabel | null;
  playedUci: string;
  bestMoveUci: string | null;
}): MoveLabel | null => {
  const isExactEngineBest = isPlayedMoveEqualToEngineBest(playedUci, bestMoveUci);

  // Strict rule:
  // - Best: only the exact engine-best move from fenBefore (UCI identity match).
  // - Excellent: if loss-based base classification produced Best but move is not exact-best.
  if (isExactEngineBest) {
    return 'Best';
  }

  return baseLabel === 'Best' ? 'Excellent' : baseLabel;
};
