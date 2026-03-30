import { Chess } from 'chess.js';
import type { StockfishEvaluation } from './stockfishAnalysis';

/**
 * Internal move-review approximation layer.
 *
 * This module intentionally does not attempt to replicate Chess.com's proprietary
 * CAPS / expected-points implementation exactly.
 */

export type MoveReviewLabel = 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'miss';

export interface MoveReviewThresholds {
  excellentMaxCpLoss: number;
  goodMaxCpLoss: number;
  inaccuracyMaxCpLoss: number;
  mistakeMaxCpLoss: number;
  blunderMaxCpLoss: number;
  missExpectedPointsLoss: number;
}

export interface MoveReviewConfig {
  thresholds: MoveReviewThresholds;
  mateCpEquivalent: number;
}

export interface PositionAnalysis {
  bestMoveUci: string | null;
  evaluation: StockfishEvaluation | null;
}

export interface PositionAnalyzer {
  analyzePosition: (fen: string) => Promise<PositionAnalysis>;
}

export interface MoveReviewPly {
  ply: number;
  sideToMove: 'w' | 'b';
  fenBefore: string;
  playedMoveUci: string;
  bestMoveUci: string | null;
  fenAfterPlayed: string;
  fenAfterBest: string | null;
  evalBefore: StockfishEvaluation | null;
  evalAfterPlayed: StockfishEvaluation | null;
  evalAfterBest: StockfishEvaluation | null;
  centipawnLoss: number | null;
  expectedPointsLoss: number | null;
  label: MoveReviewLabel | null;
}

export interface MoveReviewReport {
  config: MoveReviewConfig;
  plies: MoveReviewPly[];
}

const MATE_EVAL_SENTINEL = 50;

export const DEFAULT_MOVE_REVIEW_CONFIG: MoveReviewConfig = {
  thresholds: {
    excellentMaxCpLoss: 10,
    goodMaxCpLoss: 40,
    inaccuracyMaxCpLoss: 90,
    mistakeMaxCpLoss: 200,
    blunderMaxCpLoss: 500,
    missExpectedPointsLoss: 0.2,
  },
  mateCpEquivalent: 1000,
};

const logisticExpectedPoints = (cp: number): number => 1 / (1 + Math.exp(-cp / 120));

const evaluationToCp = (evaluation: StockfishEvaluation | null, mateCpEquivalent: number): number | null => {
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

const toMoverPerspective = (whiteCp: number, sideToMove: 'w' | 'b'): number =>
  sideToMove === 'w' ? whiteCp : -whiteCp;

const classifyMove = (
  centipawnLoss: number | null,
  expectedPointsLoss: number | null,
  config: MoveReviewConfig,
): MoveReviewLabel | null => {
  if (centipawnLoss === null) {
    return null;
  }

  if ((expectedPointsLoss ?? 0) >= config.thresholds.missExpectedPointsLoss) {
    return 'miss';
  }

  if (centipawnLoss <= 0) {
    return 'best';
  }
  if (centipawnLoss <= config.thresholds.excellentMaxCpLoss) {
    return 'excellent';
  }
  if (centipawnLoss <= config.thresholds.goodMaxCpLoss) {
    return 'good';
  }
  if (centipawnLoss <= config.thresholds.inaccuracyMaxCpLoss) {
    return 'inaccuracy';
  }
  if (centipawnLoss <= config.thresholds.mistakeMaxCpLoss) {
    return 'mistake';
  }
  if (centipawnLoss <= config.thresholds.blunderMaxCpLoss) {
    return 'blunder';
  }

  return 'blunder';
};

const mergeConfig = (config?: Partial<MoveReviewConfig>): MoveReviewConfig => ({
  thresholds: {
    ...DEFAULT_MOVE_REVIEW_CONFIG.thresholds,
    ...(config?.thresholds ?? {}),
  },
  mateCpEquivalent: config?.mateCpEquivalent ?? DEFAULT_MOVE_REVIEW_CONFIG.mateCpEquivalent,
});

const verboseMoveToUci = (move: { from: string; to: string; promotion?: string }): string =>
  `${move.from}${move.to}${move.promotion ?? ''}`;

const applyUciMoveToFen = (fen: string, uciMove: string): string | null => {
  const game = new Chess(fen);
  const from = uciMove.slice(0, 2);
  const to = uciMove.slice(2, 4);
  const promotion = uciMove.length > 4 ? uciMove.slice(4, 5) : undefined;
  const result = game.move({ from, to, promotion });
  if (!result) {
    return null;
  }

  return game.fen();
};

export const buildMoveReviewReport = async ({
  startingFen,
  moves,
  analyzer,
  config,
}: {
  startingFen: string;
  moves: Array<{ from: string; to: string; promotion?: string }>;
  analyzer: PositionAnalyzer;
  config?: Partial<MoveReviewConfig>;
}): Promise<MoveReviewReport> => {
  const mergedConfig = mergeConfig(config);
  const replay = new Chess(startingFen);
  const plies: MoveReviewPly[] = [];

  for (const [index, move] of moves.entries()) {
    const fenBefore = replay.fen();
    const sideToMove = replay.turn();
    const playedMoveUci = verboseMoveToUci(move);

    const before = await analyzer.analyzePosition(fenBefore);

    const playedResult = replay.move({ from: move.from, to: move.to, promotion: move.promotion });
    if (!playedResult) {
      break;
    }

    const fenAfterPlayed = replay.fen();
    const afterPlayed = await analyzer.analyzePosition(fenAfterPlayed);

    const fenAfterBest = before.bestMoveUci ? applyUciMoveToFen(fenBefore, before.bestMoveUci) : null;
    const afterBest = fenAfterBest ? await analyzer.analyzePosition(fenAfterBest) : null;

    const afterPlayedCpWhite = evaluationToCp(afterPlayed.evaluation, mergedConfig.mateCpEquivalent);
    const afterBestCpWhite = evaluationToCp(afterBest?.evaluation ?? null, mergedConfig.mateCpEquivalent);

    const afterPlayedCpMover =
      afterPlayedCpWhite === null ? null : toMoverPerspective(afterPlayedCpWhite, sideToMove);
    const afterBestCpMover = afterBestCpWhite === null ? null : toMoverPerspective(afterBestCpWhite, sideToMove);

    const centipawnLoss =
      afterBestCpMover === null || afterPlayedCpMover === null
        ? null
        : Math.max(0, afterBestCpMover - afterPlayedCpMover);

    const expectedPointsLoss =
      afterBestCpMover === null || afterPlayedCpMover === null
        ? null
        : Math.max(0, logisticExpectedPoints(afterBestCpMover) - logisticExpectedPoints(afterPlayedCpMover));

    plies.push({
      ply: index + 1,
      sideToMove,
      fenBefore,
      playedMoveUci,
      bestMoveUci: before.bestMoveUci,
      fenAfterPlayed,
      fenAfterBest,
      evalBefore: before.evaluation,
      evalAfterPlayed: afterPlayed.evaluation,
      evalAfterBest: afterBest?.evaluation ?? null,
      centipawnLoss,
      expectedPointsLoss,
      label: classifyMove(centipawnLoss, expectedPointsLoss, mergedConfig),
    });
  }

  return {
    config: mergedConfig,
    plies,
  };
};
