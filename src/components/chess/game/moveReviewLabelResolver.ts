import type { MoveLabel } from './moveReviewTypes';

export interface MoveLabelResolutionInput {
  isBook: boolean;
  isBrilliant: boolean;
  isGreat: boolean;
  isMiss: boolean;
  baseLabel: MoveLabel | null;
}

export interface MoveLabelResolution {
  label: MoveLabel | null;
  reasonCode: string | null;
  explanationSeed: string | null;
}

/**
 * Final single-label resolver.
 * Precedence is explicit and centralized here.
 */
export const resolveMoveLabel = ({
  isBook,
  isBrilliant,
  isGreat,
  isMiss,
  baseLabel,
}: MoveLabelResolutionInput): MoveLabelResolution => {
  if (isBook) {
    return {
      label: 'Book',
      reasonCode: 'book.opening_theory',
      explanationSeed: 'This move follows known opening theory.',
    };
  }

  if (isBrilliant) {
    return {
      label: 'Brilliant',
      reasonCode: 'special.brilliant',
      explanationSeed: 'A near-best move with a meaningful sacrifice and sufficient compensation.',
    };
  }

  if (isGreat) {
    return {
      label: 'Great',
      reasonCode: 'special.great',
      explanationSeed: 'A critical near-best move that strongly improves practical outcome.',
    };
  }

  if (isMiss) {
    return {
      label: 'Miss',
      reasonCode: 'special.miss',
      explanationSeed: 'A strong opportunity was available, but the played move failed to capitalize.',
    };
  }

  if (baseLabel) {
    return {
      label: baseLabel,
      reasonCode: `base.${baseLabel.toLowerCase()}`,
      explanationSeed: 'Resolved from base expected-points-loss classification.',
    };
  }

  return {
    label: null,
    reasonCode: null,
    explanationSeed: null,
  };
};
