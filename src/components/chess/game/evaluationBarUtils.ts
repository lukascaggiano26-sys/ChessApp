import type { StockfishEvaluation } from './stockfishAnalysis';
import type { PlayerSide } from './perspectiveUtils';

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const formatSignedScore = (value: number, decimals = 1): string => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}`;
};

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

const formatMateDisplay = (mateIn: number): string => {
  if (mateIn === 0) {
    return 'M0';
  }

  return mateIn > 0 ? `M${mateIn}` : `-M${Math.abs(mateIn)}`;
};

export const convertEvaluationToPerspective = (
  evaluation: StockfishEvaluation | null,
  perspective: PlayerSide,
): StockfishEvaluation | null => {
  if (!evaluation || perspective === 'white') {
    return evaluation;
  }

  const flippedValue = -evaluation.value;
  return {
    ...evaluation,
    value: flippedValue,
    display:
      evaluation.type === 'cp' ? formatSignedScore(flippedValue / 100, 1) : formatMateDisplay(flippedValue),
    perspective: 'black',
  };
};

export const evaluationToPerspectiveFillPercent = (
  evaluation: StockfishEvaluation | null,
  perspective: PlayerSide,
): number => {
  const whiteFill = evaluationToWhiteFillPercent(evaluation);
  return perspective === 'white' ? whiteFill : 100 - whiteFill;
};

export const evaluationAriaLabel = (display: string, depth: number, isAnalyzing: boolean): string =>
  `Evaluation ${display}. Depth ${depth}.${isAnalyzing ? ' Analyzing.' : ''}`;
