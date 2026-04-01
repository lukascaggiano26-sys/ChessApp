import type { StockfishEvaluation } from './stockfishAnalysis';

export type MoveLabel =
  | 'Brilliant'
  | 'Great'
  | 'Best'
  | 'Excellent'
  | 'Good'
  | 'Book'
  | 'Inaccuracy'
  | 'Mistake'
  | 'Miss'
  | 'Blunder';

export type MoveReviewLabel = MoveLabel;

export type ReviewSide = 'white' | 'black';

export type EngineEval = StockfishEvaluation;

export interface ExpectedPointsInputs {
  cp: number;
  side: ReviewSide;
  scale: number;
}

export interface MaterialSnapshot {
  whiteTotal: number;
  blackTotal: number;
  whiteMinusBlack: number;
}

export interface ReviewMove {
  plyIndex: number;
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  playedBy: ReviewSide;
  bestMoveUci: string | null;
  bestLine: string[] | null;
  evalBefore: EngineEval | null;
  evalAfterPlayed: EngineEval | null;
  evalAfterBest: EngineEval | null;
  expectedPointsBefore: number | null;
  expectedPointsAfterPlayed: number | null;
  expectedPointsAfterBest: number | null;
  expectedPointsLoss: number | null;
  materialBefore: MaterialSnapshot;
  materialAfter: MaterialSnapshot;
  moveLabel: MoveLabel | null;
  labelReason: string | null;
  labelReasonCode: string | null;
  labelExplanationSeed: string | null;
  isBook: boolean;
  openingName: string | null;
  ecoCode: string | null;
  bookSource: string | null;
  openingLine: string[] | null;
  openingPrefixLength: number | null;
  metadata: {
    centipawnLoss: number | null;
    cpBeforeForMover: number | null;
    cpAfterPlayedForMover: number | null;
    cpAfterBestForMover: number | null;
    baseClassificationBucket: 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'unavailable';
    usedCentipawnFallback: boolean;
    brilliantChecks: {
      nearBest: boolean;
      sacrifice: boolean;
      postMoveSafe: boolean;
      preMoveNotDominant: boolean;
      notQuicklyRecovered: boolean;
    };
    greatChecks: {
      nearBest: boolean;
      onlyMoveSave: boolean;
      majorSwing: boolean;
      outcomeClassUpgrade: boolean;
      notAlreadyWinning: boolean;
    };
    missChecks: {
      strongerContinuationExists: boolean;
      continuationWouldBeWinning: boolean;
      playedFailedToCapitalize: boolean;
      largeGapToBest: boolean;
    };
  };
}

export type MoveReviewPly = ReviewMove;

export interface ReviewSummary {
  totalPlies: number;
  labelCounts: Record<MoveLabel, number>;
}

export interface MoveReviewThresholds {
  excellentMaxCpLoss: number;
  goodMaxCpLoss: number;
  inaccuracyMaxCpLoss: number;
  mistakeMaxCpLoss: number;
  blunderMaxCpLoss: number;
  missExpectedPointsLoss: number;
  greatMaxExpectedPointsBefore: number;
  greatMaxExpectedPointsLoss: number;
  brilliantNearBestMaxExpectedPointsLoss: number;
  brilliantNearBestMaxCentipawnLoss: number;
  brilliantPostMoveMinExpectedPoints: number;
  brilliantPreMoveMaxExpectedPoints: number;
  brilliantBaseSacrificePoints: number;
  brilliantLowRating: number;
  brilliantHighRating: number;
  brilliantRecoveryWindowPlies: number;
  brilliantQuickRecoveryMaxNetLoss: number;
  outcomeWinningThresholdLowRating: number;
  outcomeWinningThresholdHighRating: number;
  outcomeLosingThresholdLowRating: number;
  outcomeLosingThresholdHighRating: number;
  greatNearBestMaxExpectedPointsLoss: number;
  greatOnlyMoveMaxExpectedPointsLossLowRating: number;
  greatOnlyMoveMaxExpectedPointsLossHighRating: number;
  greatMinSwingLowRating: number;
  greatMinSwingHighRating: number;
  missOpportunityMinAfterBestLowRating: number;
  missOpportunityMinAfterBestHighRating: number;
  missPlayedMaxAfter: number;
  missMinGapLowRating: number;
  missMinGapHighRating: number;
  missMinGainFromBefore: number;
}

export interface MoveReviewConfig {
  mateCpEquivalent: number;
  expectedPointsScale: number;
  maxBookPly: number;
  defaultPlayerRating: number;
  thresholds: MoveReviewThresholds;
}

export interface PlayerRatings {
  white?: number;
  black?: number;
}

export interface PositionAnalysis {
  bestMoveUci: string | null;
  bestLine: string[] | null;
  evaluation: EngineEval | null;
}

export interface PositionAnalyzer {
  analyzePosition: (fen: string) => Promise<PositionAnalysis>;
}

export interface ReviewMoveInput {
  from: string;
  to: string;
  promotion?: string;
}

export interface MoveReviewReport {
  config: MoveReviewConfig;
  moves: ReviewMove[];
  summary: ReviewSummary;
  debugRows?: MoveReviewDebugRow[];
}

export interface MoveReviewDebugRow {
  plyIndex: number;
  fenBefore: string;
  playedMoveSan: string;
  playedMoveUci: string;
  san: string;
  playedBy: ReviewSide;
  engineQueriedFromFenBefore: boolean;
  engineBestMoveUciFromFenBefore: string | null;
  isPlayedMoveIdenticalToBest: boolean;
  rawExpectedPointsLoss: number | null;
  rawCentipawnLoss: number | null;
  finalLabel: MoveLabel | null;
  finalReasonCode: string | null;
  baseLabel: MoveLabel | null;
  expectedPointsLoss: number | null;
  centipawnLoss: number | null;
  evalBefore: EngineEval | null;
  evalAfterPlayed: EngineEval | null;
  evalAfterBest: EngineEval | null;
  bestMoveUci: string | null;
  checks: {
    isBook: boolean;
    isBrilliant: boolean;
    isGreat: boolean;
    isMiss: boolean;
  };
  thresholdsUsed: Record<string, number | string>;
  tolerancesUsed: {
    baseClassificationEpsilon: number;
    identicalMoveCheck: 'exact-uci-match';
    clampedLossAtZero: boolean;
  };
}
