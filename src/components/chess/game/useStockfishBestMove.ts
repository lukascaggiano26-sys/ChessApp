import type { LastMove } from '../board';
import { useStockfishAnalysis } from './useStockfishAnalysis';

export const useStockfishBestMove = (fen: string, enabled: boolean): LastMove | null => {
  const analysis = useStockfishAnalysis(fen, enabled);
  return analysis.bestMove;
};
