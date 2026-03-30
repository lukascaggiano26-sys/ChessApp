import type { ChessMove } from './chessAdapter';
import {
  buildMoveReviewReport,
  type ExpectedPointsModelConfig,
  type MoveReviewConfig,
  type MoveReviewReport,
  type PlayerRatings,
} from './moveReview';
import type { BookMoveDetector } from './moveReviewBook';
import { StockfishMoveReviewAnalyzer, type StockfishMoveReviewAnalyzerOptions } from './stockfishMoveReviewAnalyzer';

export interface BuildMoveReviewOptions {
  startingFen: string;
  history: ChessMove[];
  config?: Partial<MoveReviewConfig>;
  analyzerOptions?: StockfishMoveReviewAnalyzerOptions;
  playerRatings?: PlayerRatings;
  bookMoveDetector?: BookMoveDetector;
  expectedPointsModelConfig?: Partial<ExpectedPointsModelConfig>;
  debugMode?: boolean;
}

export const buildMoveReviewFromHistory = async ({
  startingFen,
  history,
  config,
  analyzerOptions,
  playerRatings,
  bookMoveDetector,
  expectedPointsModelConfig,
  debugMode,
}: BuildMoveReviewOptions): Promise<MoveReviewReport> => {
  const analyzer = new StockfishMoveReviewAnalyzer(analyzerOptions);

  try {
    return await buildMoveReviewReport({
      startingFen,
      moves: history.map((move) => ({
        from: move.from,
        to: move.to,
      })),
      analyzer,
      config,
      playerRatings,
      bookMoveDetector,
      expectedPointsModelConfig,
      debugMode,
    });
  } finally {
    analyzer.terminate();
  }
};
