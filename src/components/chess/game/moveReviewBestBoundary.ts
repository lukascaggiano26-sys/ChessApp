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
  if (baseLabel !== 'Best') {
    return baseLabel;
  }

  // "Best" is reserved for the exact engine-best move from fenBefore.
  // Non-identical near-best moves should surface as "Excellent".
  return isPlayedMoveEqualToEngineBest(playedUci, bestMoveUci) ? 'Best' : 'Excellent';
};
