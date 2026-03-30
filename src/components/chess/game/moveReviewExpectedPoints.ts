import type { EngineEval, ExpectedPointsInputs, ReviewSide } from './moveReviewTypes';

const MATE_EVAL_SENTINEL = 50;
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/**
 * Approximation of an expected-points model.
 *
 * Chess.com has publicly stated expected points depend on rating and engine evaluation,
 * but has not disclosed the exact formula. This model is intentionally configurable
 * so it can be empirically tuned later.
 */
export interface ExpectedPointsModelConfig {
  minRating: number;
  maxRating: number;
  ratingReference: number;
  ratingExponent: number;
  baseSteepness: number;
  cpSaturation: number;
  mateBaseCpEquivalent: number;
  mateDistanceSlope: number;
  outputFloor: number;
  outputCeiling: number;
}

export const DEFAULT_EXPECTED_POINTS_MODEL_CONFIG: ExpectedPointsModelConfig = {
  minRating: 400,
  maxRating: 3200,
  ratingReference: 1500,
  ratingExponent: 0.55,
  baseSteepness: 4.2,
  cpSaturation: 350,
  mateBaseCpEquivalent: 1400,
  mateDistanceSlope: 0.03,
  outputFloor: 0.001,
  outputCeiling: 0.999,
};

export const evalToWhiteCp = (evaluation: EngineEval | null, mateCpEquivalent: number): number | null => {
  if (!evaluation) {
    return null;
  }

  if (evaluation.type === 'cp') {
    return evaluation.value;
  }

  if (evaluation.value === 0) {
    return 0;
  }

  const sign = Math.sign(evaluation.value);
  const mateDistance = Math.max(1, Math.abs(evaluation.value));
  const dampenedBonus = Math.max(0, MATE_EVAL_SENTINEL - mateDistance) * 10;
  return sign * (mateCpEquivalent + dampenedBonus);
};

export const whiteCpToSideCp = (whiteCp: number, side: ReviewSide): number => (side === 'white' ? whiteCp : -whiteCp);

export const expectedPointsFromCp = ({ cp, scale }: ExpectedPointsInputs): number => 1 / (1 + Math.exp(-cp / scale));

const ratingAdjustedSteepness = (rating: number, config: ExpectedPointsModelConfig): number => {
  const boundedRating = clamp(rating, config.minRating, config.maxRating);
  const normalized = boundedRating / config.ratingReference;
  return config.baseSteepness * Math.pow(normalized, config.ratingExponent);
};

const evalToPlayerStrength = (
  evaluation: EngineEval,
  playerSide: ReviewSide,
  config: ExpectedPointsModelConfig,
): number => {
  if (evaluation.type === 'cp') {
    const cpFromPlayerPerspective = playerSide === 'white' ? evaluation.value : -evaluation.value;
    return Math.tanh(cpFromPlayerPerspective / config.cpSaturation);
  }

  const mateFromPlayerPerspective = playerSide === 'white' ? evaluation.value : -evaluation.value;
  if (mateFromPlayerPerspective === 0) {
    return 0;
  }

  const direction = Math.sign(mateFromPlayerPerspective);
  const distance = Math.max(1, Math.abs(mateFromPlayerPerspective));
  const cpEquivalent =
    direction *
    (config.mateBaseCpEquivalent / (1 + config.mateDistanceSlope * distance));
  return Math.tanh(cpEquivalent / config.cpSaturation);
};

export const engineEvalToExpectedPoints = (
  evaluation: EngineEval | null,
  playerRating: number,
  playerSide: ReviewSide,
  config: ExpectedPointsModelConfig = DEFAULT_EXPECTED_POINTS_MODEL_CONFIG,
): number | null => {
  if (!evaluation) {
    return null;
  }

  const strength = evalToPlayerStrength(evaluation, playerSide, config);
  const steepness = ratingAdjustedSteepness(playerRating, config);
  const raw = 1 / (1 + Math.exp(-strength * steepness));
  return clamp(raw, config.outputFloor, config.outputCeiling);
};
