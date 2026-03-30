import type { JSX } from 'react';
import type { StockfishEvaluation } from './stockfishAnalysis';
import { evaluationAriaLabel, evaluationToWhiteFillPercent } from './evaluationBarUtils';

type EvaluationBarProps = {
  evaluation: StockfishEvaluation | null;
  depth: number;
  isAnalyzing: boolean;
  error?: string | null;
  className?: string;
};

const evalText = (evaluation: StockfishEvaluation | null, error: string | null | undefined): string => {
  if (error) {
    return 'Engine error';
  }
  if (!evaluation) {
    return '--';
  }

  return evaluation.display;
};

export const EvaluationBar = ({
  evaluation,
  depth,
  isAnalyzing,
  error = null,
  className,
}: EvaluationBarProps): JSX.Element => {
  const display = evalText(evaluation, error);
  const fillPercent = evaluationToWhiteFillPercent(evaluation);

  return (
    <section className={`evalbar ${className ?? ''}`.trim()} aria-label="Engine evaluation">
      <div className="evalbar-track-wrap">
        <div
          className="evalbar-track"
          role="meter"
          aria-label={evaluationAriaLabel(display, depth, isAnalyzing)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(fillPercent)}
        >
          <div
            className="evalbar-black"
            style={{ height: `${100 - fillPercent}%`, width: `${100 - fillPercent}%` }}
          />
          <div className="evalbar-white" style={{ height: `${fillPercent}%`, width: `${fillPercent}%` }} />
        </div>
      </div>

      <div className="evalbar-meta">
        <strong className="evalbar-score">{display}</strong>
        <small className="evalbar-depth">
          D{depth}
          {isAnalyzing ? ' • analyzing' : ''}
        </small>
      </div>
    </section>
  );
};
