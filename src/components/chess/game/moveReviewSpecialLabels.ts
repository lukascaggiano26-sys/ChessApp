import { Chess } from 'chess.js';
import { getMaterialBalanceFromFen } from './materialBalance';
import type { MoveReviewConfig, ReviewSide } from './moveReviewTypes';

export interface BrilliantDetectionResult {
  isBrilliant: boolean;
  reasons: {
    nearBest: boolean;
    sacrifice: boolean;
    postMoveSafe: boolean;
    preMoveNotDominant: boolean;
    notQuicklyRecovered: boolean;
  };
  details: {
    expectedPointsLoss: number | null;
    centipawnLoss: number | null;
    moverMaterialLossImmediate: number;
    moverMaterialLossAfterWindow: number | null;
    requiredSacrifice: number;
    postMoveExpectedPoints: number | null;
    preMoveExpectedPoints: number | null;
  };
}

export interface GreatDetectionResult {
  isGreat: boolean;
  reasons: {
    nearBest: boolean;
    onlyMoveSave: boolean;
    majorSwing: boolean;
    outcomeClassUpgrade: boolean;
    notAlreadyWinning: boolean;
  };
  details: {
    expectedPointsBefore: number | null;
    expectedPointsAfterPlayed: number | null;
    expectedPointsAfterBest: number | null;
    expectedPointsLoss: number | null;
    swing: number | null;
    beforeClass: 'winning' | 'equal' | 'losing' | 'unknown';
    afterClass: 'winning' | 'equal' | 'losing' | 'unknown';
  };
}

export interface MissDetectionResult {
  isMiss: boolean;
  reasons: {
    strongerContinuationExists: boolean;
    continuationWouldBeWinning: boolean;
    playedFailedToCapitalize: boolean;
    largeGapToBest: boolean;
  };
  details: {
    expectedPointsBefore: number | null;
    expectedPointsAfterPlayed: number | null;
    expectedPointsAfterBest: number | null;
    opportunityGain: number | null;
    gapToBest: number | null;
  };
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const lerp = (from: number, to: number, t: number): number => from + (to - from) * clamp01(t);

const ratingProgress = (rating: number, config: MoveReviewConfig): number => {
  const low = config.thresholds.brilliantLowRating;
  const high = config.thresholds.brilliantHighRating;
  if (high <= low) {
    return 1;
  }

  return clamp01((rating - low) / (high - low));
};

const moverMaterialDelta = (whiteMinusBlack: number, side: ReviewSide): number =>
  side === 'white' ? whiteMinusBlack : -whiteMinusBlack;

const applyUciMove = (game: Chess, uciMove: string): boolean => {
  const from = uciMove.slice(0, 2);
  const to = uciMove.slice(2, 4);
  const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
  return Boolean(game.move({ from, to, promotion }));
};

const evaluateRecoveryWindowLoss = ({
  fenAfter,
  side,
  recoveryWindowPlies,
  bestLine,
}: {
  fenAfter: string;
  side: ReviewSide;
  recoveryWindowPlies: number;
  bestLine: string[] | null;
}): number | null => {
  if (!bestLine?.length || recoveryWindowPlies <= 0) {
    return null;
  }

  const replay = new Chess(fenAfter);
  const before = getMaterialBalanceFromFen(fenAfter, 'white');
  const moverBefore = moverMaterialDelta(before.whiteMinusBlack, side);

  const maxPlies = Math.min(recoveryWindowPlies, bestLine.length);
  for (let i = 0; i < maxPlies; i += 1) {
    if (!applyUciMove(replay, bestLine[i])) {
      return null;
    }
  }

  const after = getMaterialBalanceFromFen(replay.fen(), 'white');
  const moverAfter = moverMaterialDelta(after.whiteMinusBlack, side);
  return Math.max(0, moverBefore - moverAfter);
};

const outcomeClass = (
  expectedPoints: number | null,
  rating: number,
  config: MoveReviewConfig,
): 'winning' | 'equal' | 'losing' | 'unknown' => {
  if (expectedPoints === null) {
    return 'unknown';
  }

  const t = ratingProgress(rating, config);
  const winningThreshold = lerp(
    config.thresholds.outcomeWinningThresholdLowRating,
    config.thresholds.outcomeWinningThresholdHighRating,
    t,
  );
  const losingThreshold = lerp(
    config.thresholds.outcomeLosingThresholdLowRating,
    config.thresholds.outcomeLosingThresholdHighRating,
    t,
  );

  if (expectedPoints >= winningThreshold) {
    return 'winning';
  }
  if (expectedPoints <= losingThreshold) {
    return 'losing';
  }
  return 'equal';
};

/**
 * Best-faith implementation of Chess.com's published brilliant-move idea.
 *
 * This is NOT an exact replication of Chess.com's undisclosed internal formula.
 * It uses explainable, configurable gates based on public rules.
 */
export const detectBrilliantMove = ({
  expectedPointsLoss,
  centipawnLoss,
  expectedPointsBefore,
  expectedPointsAfterPlayed,
  materialBeforeWhiteMinusBlack,
  materialAfterWhiteMinusBlack,
  afterPlayedBestLine,
  fenAfter,
  playedBy,
  playerRating,
  config,
}: {
  expectedPointsLoss: number | null;
  centipawnLoss: number | null;
  expectedPointsBefore: number | null;
  expectedPointsAfterPlayed: number | null;
  materialBeforeWhiteMinusBlack: number;
  materialAfterWhiteMinusBlack: number;
  afterPlayedBestLine: string[] | null;
  fenAfter: string;
  playedBy: ReviewSide;
  playerRating: number;
  config: MoveReviewConfig;
}): BrilliantDetectionResult => {
  const ratingT = ratingProgress(playerRating, config);

  const requiredSacrifice = lerp(
    config.thresholds.brilliantBaseSacrificePoints * 0.8,
    config.thresholds.brilliantBaseSacrificePoints,
    ratingT,
  );

  const nearBestByExpected =
    expectedPointsLoss !== null &&
    expectedPointsLoss <= config.thresholds.brilliantNearBestMaxExpectedPointsLoss;
  const nearBestByCp =
    centipawnLoss !== null &&
    centipawnLoss <= config.thresholds.brilliantNearBestMaxCentipawnLoss;
  const nearBest = nearBestByExpected || nearBestByCp;

  const moverBefore = moverMaterialDelta(materialBeforeWhiteMinusBlack, playedBy);
  const moverAfter = moverMaterialDelta(materialAfterWhiteMinusBlack, playedBy);
  const moverMaterialLossImmediate = Math.max(0, moverBefore - moverAfter);
  const sacrifice = moverMaterialLossImmediate >= requiredSacrifice;

  const moverMaterialLossAfterWindow = evaluateRecoveryWindowLoss({
    fenAfter,
    side: playedBy,
    recoveryWindowPlies: config.thresholds.brilliantRecoveryWindowPlies,
    bestLine: afterPlayedBestLine,
  });

  const notQuicklyRecovered =
    moverMaterialLossAfterWindow === null ||
    moverMaterialLossAfterWindow >= config.thresholds.brilliantQuickRecoveryMaxNetLoss;

  const postMoveSafe =
    expectedPointsAfterPlayed !== null &&
    expectedPointsAfterPlayed >= config.thresholds.brilliantPostMoveMinExpectedPoints;

  const preMoveNotDominant =
    expectedPointsBefore !== null &&
    expectedPointsBefore <= config.thresholds.brilliantPreMoveMaxExpectedPoints;

  const isBrilliant = nearBest && sacrifice && postMoveSafe && preMoveNotDominant && notQuicklyRecovered;

  return {
    isBrilliant,
    reasons: {
      nearBest,
      sacrifice,
      postMoveSafe,
      preMoveNotDominant,
      notQuicklyRecovered,
    },
    details: {
      expectedPointsLoss,
      centipawnLoss,
      moverMaterialLossImmediate,
      moverMaterialLossAfterWindow,
      requiredSacrifice,
      postMoveExpectedPoints: expectedPointsAfterPlayed,
      preMoveExpectedPoints: expectedPointsBefore,
    },
  };
};

export const detectGreatMove = ({
  expectedPointsBefore,
  expectedPointsAfterPlayed,
  expectedPointsAfterBest,
  expectedPointsLoss,
  playerRating,
  config,
}: {
  expectedPointsBefore: number | null;
  expectedPointsAfterPlayed: number | null;
  expectedPointsAfterBest: number | null;
  expectedPointsLoss: number | null;
  playerRating: number;
  config: MoveReviewConfig;
}): GreatDetectionResult => {
  const ratingT = ratingProgress(playerRating, config);
  const onlyMoveMaxLoss = lerp(
    config.thresholds.greatOnlyMoveMaxExpectedPointsLossLowRating,
    config.thresholds.greatOnlyMoveMaxExpectedPointsLossHighRating,
    ratingT,
  );
  const minSwing = lerp(config.thresholds.greatMinSwingLowRating, config.thresholds.greatMinSwingHighRating, ratingT);

  const beforeClass = outcomeClass(expectedPointsBefore, playerRating, config);
  const afterClass = outcomeClass(expectedPointsAfterPlayed, playerRating, config);

  const nearBest =
    expectedPointsLoss !== null &&
    expectedPointsLoss <= config.thresholds.greatNearBestMaxExpectedPointsLoss;

  const onlyMoveSave =
    beforeClass === 'losing' &&
    afterClass !== 'losing' &&
    expectedPointsLoss !== null &&
    expectedPointsLoss <= onlyMoveMaxLoss;

  const swing =
    expectedPointsBefore === null || expectedPointsAfterPlayed === null
      ? null
      : expectedPointsAfterPlayed - expectedPointsBefore;
  const majorSwing = swing !== null && swing >= minSwing;

  const outcomeClassUpgrade =
    (beforeClass === 'losing' && (afterClass === 'equal' || afterClass === 'winning')) ||
    (beforeClass === 'equal' && afterClass === 'winning');

  const notAlreadyWinning = beforeClass !== 'winning';
  const isGreat = nearBest && notAlreadyWinning && (onlyMoveSave || majorSwing || outcomeClassUpgrade);

  return {
    isGreat,
    reasons: {
      nearBest,
      onlyMoveSave,
      majorSwing,
      outcomeClassUpgrade,
      notAlreadyWinning,
    },
    details: {
      expectedPointsBefore,
      expectedPointsAfterPlayed,
      expectedPointsAfterBest,
      expectedPointsLoss,
      swing,
      beforeClass,
      afterClass,
    },
  };
};

export const detectMiss = ({
  expectedPointsBefore,
  expectedPointsAfterPlayed,
  expectedPointsAfterBest,
  playerRating,
  config,
}: {
  expectedPointsBefore: number | null;
  expectedPointsAfterPlayed: number | null;
  expectedPointsAfterBest: number | null;
  playerRating: number;
  config: MoveReviewConfig;
}): MissDetectionResult => {
  const ratingT = ratingProgress(playerRating, config);
  const opportunityThreshold = lerp(
    config.thresholds.missOpportunityMinAfterBestLowRating,
    config.thresholds.missOpportunityMinAfterBestHighRating,
    ratingT,
  );
  const minGap = lerp(config.thresholds.missMinGapLowRating, config.thresholds.missMinGapHighRating, ratingT);

  const opportunityGain =
    expectedPointsAfterBest === null || expectedPointsBefore === null
      ? null
      : expectedPointsAfterBest - expectedPointsBefore;
  const gapToBest =
    expectedPointsAfterBest === null || expectedPointsAfterPlayed === null
      ? null
      : expectedPointsAfterBest - expectedPointsAfterPlayed;

  const strongerContinuationExists = opportunityGain !== null && opportunityGain >= config.thresholds.missMinGainFromBefore;
  const continuationWouldBeWinning =
    expectedPointsAfterBest !== null && expectedPointsAfterBest >= opportunityThreshold;
  const playedFailedToCapitalize =
    expectedPointsAfterPlayed !== null && expectedPointsAfterPlayed <= config.thresholds.missPlayedMaxAfter;
  const largeGapToBest = gapToBest !== null && gapToBest >= minGap;

  const isMiss = strongerContinuationExists && continuationWouldBeWinning && playedFailedToCapitalize && largeGapToBest;

  return {
    isMiss,
    reasons: {
      strongerContinuationExists,
      continuationWouldBeWinning,
      playedFailedToCapitalize,
      largeGapToBest,
    },
    details: {
      expectedPointsBefore,
      expectedPointsAfterPlayed,
      expectedPointsAfterBest,
      opportunityGain,
      gapToBest,
    },
  };
};
