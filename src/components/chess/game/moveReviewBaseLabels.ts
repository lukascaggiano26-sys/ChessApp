import type { MoveLabel } from './moveReviewTypes';

const EPSILON = 1e-9;

export interface BaseClassificationThresholds {
  excellentUpper: number;
  goodUpper: number;
  inaccuracyUpper: number;
  mistakeUpper: number;
  blunderLower: number;
}

export interface BaseClassificationExplanation {
  metric: 'expectedPointsLoss' | 'centipawnLossFallback' | 'unavailable';
  bucket: 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'unavailable';
  value: number | null;
  epsilon: number;
  thresholds: BaseClassificationThresholds;
}

export interface BaseClassificationResult {
  label: MoveLabel | null;
  explanation: BaseClassificationExplanation;
}

const DEFAULT_THRESHOLDS: BaseClassificationThresholds = {
  excellentUpper: 0.02,
  goodUpper: 0.05,
  inaccuracyUpper: 0.1,
  mistakeUpper: 0.2,
  blunderLower: 0.2,
};

const asNonNegative = (value: number): number => (value < 0 ? 0 : value);

export const classifyBaseMoveByExpectedPointsLoss = (
  expectedPointsLoss: number | null,
  thresholds: BaseClassificationThresholds = DEFAULT_THRESHOLDS,
  isBestMove = false,
): BaseClassificationResult => {
  if (expectedPointsLoss === null || Number.isNaN(expectedPointsLoss)) {
    return {
      label: null,
      explanation: {
        metric: 'unavailable',
        bucket: 'unavailable',
        value: null,
        epsilon: EPSILON,
        thresholds,
      },
    };
  }

  const loss = asNonNegative(expectedPointsLoss);

  // Only label as Best if the played move is literally the engine's top choice
  if (isBestMove) {
    return {
      label: 'Best',
      explanation: {
        metric: 'expectedPointsLoss',
        bucket: 'best',
        value: loss,
        epsilon: EPSILON,
        thresholds,
      },
    };
  }

  // Remove the old epsilon check for Best — fall through to Excellent instead
  if (loss <= thresholds.excellentUpper + EPSILON) {
    return {
      label: 'Excellent',
      explanation: {
        metric: 'expectedPointsLoss',
        bucket: 'excellent',
        value: loss,
        epsilon: EPSILON,
        thresholds,
      },
    };
  }

  if (loss <= thresholds.goodUpper + EPSILON) {
    return {
      label: 'Good',
      explanation: {
        metric: 'expectedPointsLoss',
        bucket: 'good',
        value: loss,
        epsilon: EPSILON,
        thresholds,
      },
    };
  }

  if (loss <= thresholds.inaccuracyUpper + EPSILON) {
    return {
      label: 'Inaccuracy',
      explanation: {
        metric: 'expectedPointsLoss',
        bucket: 'inaccuracy',
        value: loss,
        epsilon: EPSILON,
        thresholds,
      },
    };
  }

  if (loss <= thresholds.mistakeUpper + EPSILON) {
    return {
      label: 'Mistake',
      explanation: {
        metric: 'expectedPointsLoss',
        bucket: 'mistake',
        value: loss,
        epsilon: EPSILON,
        thresholds,
      },
    };
  }

  return {
    label: 'Blunder',
    explanation: {
      metric: 'expectedPointsLoss',
      bucket: 'blunder',
      value: loss,
      epsilon: EPSILON,
      thresholds,
    },
  };
};

/**
 * Isolated temporary fallback path (for cases where expected-points loss is unavailable).
 * Keep this separate so it can be removed/tuned independently.
 */
export const classifyBaseMoveByCentipawnFallback = (centipawnLoss: number | null): BaseClassificationResult => {
  if (centipawnLoss === null || Number.isNaN(centipawnLoss)) {
    return {
      label: null,
      explanation: {
        metric: 'unavailable',
        bucket: 'unavailable',
        value: null,
        epsilon: EPSILON,
        thresholds: DEFAULT_THRESHOLDS,
      },
    };
  }

  const loss = asNonNegative(centipawnLoss);
  const normalized = Math.min(1, loss / 500);

  const mapped = classifyBaseMoveByExpectedPointsLoss(normalized, DEFAULT_THRESHOLDS);
  return {
    ...mapped,
    explanation: {
      ...mapped.explanation,
      metric: 'centipawnLossFallback',
      value: loss,
    },
  };
};
