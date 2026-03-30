import type { StockfishEvaluation } from './stockfishAnalysis';

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const evaluationToWhiteFillPercent = (evaluation: StockfishEvaluation | null): number => {
  if (!evaluation) {
    return 50;
  }

  if (evaluation.type === 'mate') {
    if (evaluation.value > 0) {
      return 98;
    }
    if (evaluation.value < 0) {
      return 2;
    }
    return 50;
  }

  const pawns = evaluation.value / 100;
  const normalized = 0.5 + 0.5 * Math.tanh(pawns / 2.2);
  return clamp01(normalized) * 100;
};

export const evaluationAriaLabel = (display: string, depth: number, isAnalyzing: boolean): string =>
  `Evaluation ${display}. Depth ${depth}.${isAnalyzing ? ' Analyzing.' : ''}`;
