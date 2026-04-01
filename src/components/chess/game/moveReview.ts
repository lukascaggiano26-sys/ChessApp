import {
  classifyBaseMoveByCentipawnFallback,
  classifyBaseMoveByExpectedPointsLoss,
} from './moveReviewBaseLabels';
import { defaultBookMoveDetector, type BookMoveDetector } from './moveReviewBook';
import { mergeMoveReviewConfig, DEFAULT_MOVE_REVIEW_CONFIG } from './moveReviewConfig';
import { DEFAULT_MOVE_REVIEW_CALIBRATION_CONFIG } from './moveReviewCalibrationConfig';
import { resolveMoveLabel } from './moveReviewLabelResolver';
import { detectBrilliantMove, detectGreatMove, detectMiss } from './moveReviewSpecialLabels';
import {
  DEFAULT_EXPECTED_POINTS_MODEL_CONFIG,
  type ExpectedPointsModelConfig,
  engineEvalToExpectedPoints,
  evalToWhiteCp,
  whiteCpToSideCp,
} from './moveReviewExpectedPoints';
import { applyUciMoveToFen, traverseGameMoves } from './moveReviewTraversal';
import {
  enforceBestLabelBoundary,
  isPlayedMoveEqualToEngineBest,
} from './moveReviewBestBoundary';
import type {
  MoveReviewConfig,
  MoveReviewLabel,
  MoveReviewReport,
  MoveReviewDebugRow,
  PlayerRatings,
  PositionAnalyzer,
  ReviewMoveInput,
  ReviewSummary,
} from './moveReviewTypes';

/**
 * Move-review foundation.
 *
 * IMPORTANT:
 * - Uses publicly-known concepts (engine deltas / expected-points style ideas).
 * - Does NOT claim exact Chess.com algorithmic equivalence where formulas are undisclosed.
 */
export const buildMoveReviewReport = async ({
  startingFen,
  moves,
  analyzer,
  config,
  playerRatings,
  bookMoveDetector,
  expectedPointsModelConfig,
  debugMode = false,
}: {
  startingFen: string;
  moves: ReviewMoveInput[];
  analyzer: PositionAnalyzer;
  config?: Partial<MoveReviewConfig>;
  playerRatings?: PlayerRatings;
  bookMoveDetector?: BookMoveDetector;
  expectedPointsModelConfig?: Partial<ExpectedPointsModelConfig>;
  debugMode?: boolean;
}): Promise<MoveReviewReport> => {
  const DEBUG_TARGET_FEN_AFTER_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
  const mergedConfig = mergeMoveReviewConfig({
    ...DEFAULT_MOVE_REVIEW_CALIBRATION_CONFIG.reviewConfig,
    ...config,
  });
  const mergedExpectedPointsModelConfig: ExpectedPointsModelConfig = {
    ...DEFAULT_MOVE_REVIEW_CALIBRATION_CONFIG.expectedPointsModelConfig,
    ...DEFAULT_EXPECTED_POINTS_MODEL_CONFIG,
    ...(expectedPointsModelConfig ?? {}),
  };
  const detector = bookMoveDetector ?? defaultBookMoveDetector;
  const traversed = traverseGameMoves(startingFen, moves);
  const analysisCache = new Map<string, Awaited<ReturnType<PositionAnalyzer['analyzePosition']>>>();

  const reviewedMoves = [] as MoveReviewReport['moves'];
  const debugRows: MoveReviewDebugRow[] = [];
  const sanPrefix: string[] = [];

  const analyzeWithCache = async (fen: string) => {
    const cached = analysisCache.get(fen);
    if (cached) {
      return cached;
    }

    const analyzed = await analyzer.analyzePosition(fen);
    analysisCache.set(fen, analyzed);
    return analyzed;
  };

  for (const ply of traversed) {
    sanPrefix.push(ply.san);
    const before = await analyzeWithCache(ply.fenBefore);
    const afterPlayed = await analyzeWithCache(ply.fenAfter);

    const fenAfterBest = before.bestMoveUci ? applyUciMoveToFen(ply.fenBefore, before.bestMoveUci) : null;
    const afterBest = fenAfterBest ? await analyzeWithCache(fenAfterBest) : null;

    const cpBeforeWhite = evalToWhiteCp(before.evaluation, mergedConfig.mateCpEquivalent);
    const cpAfterPlayedWhite = evalToWhiteCp(afterPlayed.evaluation, mergedConfig.mateCpEquivalent);
    const cpAfterBestWhite = evalToWhiteCp(afterBest?.evaluation ?? null, mergedConfig.mateCpEquivalent);

    const cpBeforeForMover =
      cpBeforeWhite === null ? null : whiteCpToSideCp(cpBeforeWhite, ply.playedBy === 'white' ? 'white' : 'black');
    const cpAfterPlayedForMover =
      cpAfterPlayedWhite === null
        ? null
        : whiteCpToSideCp(cpAfterPlayedWhite, ply.playedBy === 'white' ? 'white' : 'black');
    const cpAfterBestForMover =
      cpAfterBestWhite === null
        ? null
        : whiteCpToSideCp(cpAfterBestWhite, ply.playedBy === 'white' ? 'white' : 'black');

    const currentPlayerRating =
      ply.playedBy === 'white'
        ? playerRatings?.white ?? mergedConfig.defaultPlayerRating
        : playerRatings?.black ?? mergedConfig.defaultPlayerRating;

    const expectedPointsBefore = engineEvalToExpectedPoints(
      before.evaluation,
      currentPlayerRating,
      ply.playedBy,
      mergedExpectedPointsModelConfig,
    );
    const expectedPointsAfterPlayed = engineEvalToExpectedPoints(
      afterPlayed.evaluation,
      currentPlayerRating,
      ply.playedBy,
      mergedExpectedPointsModelConfig,
    );
    const expectedPointsAfterBest = engineEvalToExpectedPoints(
      afterBest?.evaluation ?? null,
      currentPlayerRating,
      ply.playedBy,
      mergedExpectedPointsModelConfig,
    );

    const rawCentipawnLoss =
      cpAfterBestForMover === null || cpAfterPlayedForMover === null
        ? null
        : cpAfterBestForMover - cpAfterPlayedForMover;
    const centipawnLoss = rawCentipawnLoss === null ? null : Math.max(0, rawCentipawnLoss);

    const rawExpectedPointsLoss =
      expectedPointsAfterBest === null || expectedPointsAfterPlayed === null
        ? null
        : expectedPointsAfterBest - expectedPointsAfterPlayed;
    const expectedPointsLoss = rawExpectedPointsLoss === null ? null : Math.max(0, rawExpectedPointsLoss);
    const isPlayedMoveIdenticalToBest = isPlayedMoveEqualToEngineBest(ply.uci, before.bestMoveUci);

    const bookDetection = detector.detectMove({
      startingFen,
      fenBefore: ply.fenBefore,
      playedMoveUci: ply.uci,
      playedMoveSan: ply.san,
      movesSanPrefix: [...sanPrefix],
      plyIndex: ply.plyIndex,
    });
    const isBook = bookDetection.isBook;

    const baseClassificationRaw =
      expectedPointsLoss === null
        ? classifyBaseMoveByCentipawnFallback(centipawnLoss)
        : classifyBaseMoveByExpectedPointsLoss(expectedPointsLoss);
    const baseLabel = enforceBestLabelBoundary({
      baseLabel: baseClassificationRaw.label,
      playedUci: ply.uci,
      bestMoveUci: before.bestMoveUci,
    });
    // Label semantics boundary:
    // - Best: exact engine-best move from fenBefore.
    // - Excellent: near-best/tiny-loss but non-identical to the engine-best move.
    const baseClassification =
      baseLabel === baseClassificationRaw.label
        ? baseClassificationRaw
        : {
            ...baseClassificationRaw,
            label: baseLabel,
            explanation: {
              ...baseClassificationRaw.explanation,
              bucket: 'excellent' as const,
            },
          };
    const brilliant = detectBrilliantMove({
      expectedPointsLoss,
      centipawnLoss,
      expectedPointsBefore,
      expectedPointsAfterPlayed,
      materialBeforeWhiteMinusBlack: ply.materialBefore.whiteMinusBlack,
      materialAfterWhiteMinusBlack: ply.materialAfter.whiteMinusBlack,
      afterPlayedBestLine: afterPlayed.bestLine,
      fenAfter: ply.fenAfter,
      playedBy: ply.playedBy,
      playerRating: currentPlayerRating,
      config: mergedConfig,
    });
    const great = detectGreatMove({
      expectedPointsBefore,
      expectedPointsAfterPlayed,
      expectedPointsAfterBest,
      expectedPointsLoss,
      playerRating: currentPlayerRating,
      config: mergedConfig,
    });
    const miss = detectMiss({
      expectedPointsBefore,
      expectedPointsAfterPlayed,
      expectedPointsAfterBest,
      playerRating: currentPlayerRating,
      config: mergedConfig,
    });
    const labelResolution = resolveMoveLabel({
      isBook,
      isBrilliant: brilliant.isBrilliant,
      isGreat: great.isGreat,
      isMiss: miss.isMiss,
      baseLabel: baseClassification.label as MoveReviewLabel | null,
    });

    if (
      debugMode &&
      typeof console !== 'undefined' &&
      sanPrefix.length <= 2 &&
      sanPrefix[0] === 'e4' &&
      (sanPrefix.length === 1 || sanPrefix[1] === 'e6')
    ) {
      console.debug('[move-review][french-debug]', {
        ply: ply.plyIndex + 1,
        startingFen,
        sanPrefix,
        normalizedSanPrefix: sanPrefix.map((san) => san.replace(/[+#]+$/g, '').replace(/[!?]+/g, '').trim()),
        openingName: bookDetection.openingName,
        ecoCode: bookDetection.ecoCode,
        isBook: bookDetection.isBook,
        finalLabel: labelResolution.label,
      });
    }

    reviewedMoves.push({
      plyIndex: ply.plyIndex,
      san: ply.san,
      uci: ply.uci,
      fenBefore: ply.fenBefore,
      fenAfter: ply.fenAfter,
      playedBy: ply.playedBy,
      bestMoveUci: before.bestMoveUci,
      bestLine: before.bestLine,
      evalBefore: before.evaluation,
      evalAfterPlayed: afterPlayed.evaluation,
      evalAfterBest: afterBest?.evaluation ?? null,
      expectedPointsBefore,
      expectedPointsAfterPlayed,
      expectedPointsAfterBest,
      expectedPointsLoss,
      materialBefore: ply.materialBefore,
      materialAfter: ply.materialAfter,
      moveLabel: labelResolution.label,
      labelReason: labelResolution.reasonCode,
      labelReasonCode: labelResolution.reasonCode,
      labelExplanationSeed: labelResolution.explanationSeed,
      isBook,
      openingName: bookDetection.openingName,
      ecoCode: bookDetection.ecoCode,
      bookSource: bookDetection.bookSource,
      openingLine: bookDetection.matchedLine,
      openingPrefixLength: bookDetection.matchedPrefixLength,
      metadata: {
        centipawnLoss,
        cpBeforeForMover,
        cpAfterPlayedForMover,
        cpAfterBestForMover,
        baseClassificationBucket: baseClassification.explanation.bucket,
        usedCentipawnFallback: baseClassification.explanation.metric === 'centipawnLossFallback',
        brilliantChecks: brilliant.reasons,
        greatChecks: great.reasons,
        missChecks: miss.reasons,
      },
    });

    if (debugMode) {
      const debugRow: MoveReviewDebugRow = {
        plyIndex: ply.plyIndex,
        fenBefore: ply.fenBefore,
        playedMoveSan: ply.san,
        playedMoveUci: ply.uci,
        san: ply.san,
        playedBy: ply.playedBy,
        engineQueriedFromFenBefore: true,
        engineBestMoveUciFromFenBefore: before.bestMoveUci,
        isPlayedMoveIdenticalToBest,
        rawExpectedPointsLoss,
        rawCentipawnLoss,
        finalLabel: labelResolution.label,
        finalReasonCode: labelResolution.reasonCode,
        baseLabel: baseClassification.label,
        expectedPointsLoss,
        centipawnLoss,
        evalBefore: before.evaluation,
        evalAfterPlayed: afterPlayed.evaluation,
        evalAfterBest: afterBest?.evaluation ?? null,
        bestMoveUci: before.bestMoveUci,
        checks: {
          isBook,
          isBrilliant: brilliant.isBrilliant,
          isGreat: great.isGreat,
          isMiss: miss.isMiss,
        },
        thresholdsUsed: {
          ...mergedConfig.thresholds,
          defaultPlayerRating: mergedConfig.defaultPlayerRating,
          expectedPointsCpSaturation: mergedExpectedPointsModelConfig.cpSaturation,
          expectedPointsBaseSteepness: mergedExpectedPointsModelConfig.baseSteepness,
          expectedPointsRatingExponent: mergedExpectedPointsModelConfig.ratingExponent,
        },
        tolerancesUsed: {
          baseClassificationEpsilon: baseClassification.explanation.epsilon,
          identicalMoveCheck: 'exact-uci-match',
          clampedLossAtZero: (rawExpectedPointsLoss ?? 0) < 0 || (rawCentipawnLoss ?? 0) < 0,
        },
      };
      debugRows.push(debugRow);

      if (ply.fenBefore === DEBUG_TARGET_FEN_AFTER_E4 && typeof console !== 'undefined') {
        console.info('[move-review debug] position after 1.e4', debugRow);
      }
    }
  }

  const labelCounts: ReviewSummary['labelCounts'] = {
    Brilliant: 0,
    Great: 0,
    Best: 0,
    Excellent: 0,
    Good: 0,
    Book: 0,
    Inaccuracy: 0,
    Mistake: 0,
    Miss: 0,
    Blunder: 0,
  };

  for (const move of reviewedMoves) {
    if (move.moveLabel) {
      labelCounts[move.moveLabel] += 1;
    }
  }

  return {
    config: mergedConfig,
    moves: reviewedMoves,
    summary: {
      totalPlies: reviewedMoves.length,
      labelCounts,
    },
    ...(debugMode ? { debugRows } : {}),
  };
};

export { DEFAULT_MOVE_REVIEW_CONFIG };
export {
  DEFAULT_EXPECTED_POINTS_MODEL_CONFIG,
  engineEvalToExpectedPoints,
} from './moveReviewExpectedPoints';
export { DEFAULT_MOVE_REVIEW_CALIBRATION_CONFIG } from './moveReviewCalibrationConfig';
export { defaultBookMoveDetector };
export { resolveMoveLabel };
export type { BookDetectionResult, BookMoveContext, BookMoveDetector } from './moveReviewBook';
export { createBookMoveDetector } from './moveReviewBook';
export { staticOpeningLinesProvider } from './openingBookProvider';
export type { OpeningBookMatch, OpeningBookProvider } from './openingBookProvider';
export type { MoveLabelResolution, MoveLabelResolutionInput } from './moveReviewLabelResolver';
export { detectBrilliantMove, detectGreatMove, detectMiss };
export type { BrilliantDetectionResult, GreatDetectionResult, MissDetectionResult } from './moveReviewSpecialLabels';
export type { ExpectedPointsModelConfig } from './moveReviewExpectedPoints';
export type { MoveReviewCalibrationConfig } from './moveReviewCalibrationConfig';
export type {
  EngineEval,
  ExpectedPointsInputs,
  MaterialSnapshot,
  MoveLabel,
  MoveReviewDebugRow,
  MoveReviewConfig,
  MoveReviewLabel,
  MoveReviewPly,
  MoveReviewReport,
  PlayerRatings,
  PositionAnalysis,
  PositionAnalyzer,
  ReviewMove,
  ReviewSummary,
} from './moveReviewTypes';
