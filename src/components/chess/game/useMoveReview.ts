import type { ChessMove } from './chessAdapter';
import { buildMoveReviewReport, type MoveReviewConfig, type MoveReviewReport } from './moveReview';
import { StockfishMoveReviewAnalyzer, type StockfishMoveReviewAnalyzerOptions } from './stockfishMoveReviewAnalyzer';

export interface BuildMoveReviewOptions {
  startingFen: string;
  history: ChessMove[];
  config?: Partial<MoveReviewConfig>;
  analyzerOptions?: StockfishMoveReviewAnalyzerOptions;
}

export const buildMoveReviewFromHistory = async ({
  startingFen,
  history,
  config,
  analyzerOptions,
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
    });
  } finally {
    analyzer.terminate();
  }
};
