import type { JSX } from 'react';
import { useMaterialBalance } from './materialBalance';
import type { PlayerSide } from './perspectiveUtils';

export interface MaterialAdvantageIndicatorProps {
  fen: string;
  perspective?: PlayerSide;
  className?: string;
}

const formatSignedValue = (value: number): string => {
  if (value > 0) {
    return `+${value}`;
  }

  return `${value}`;
};

export const MaterialAdvantageIndicator = ({
  fen,
  perspective = 'white',
  className,
}: MaterialAdvantageIndicatorProps): JSX.Element => {
  const material = useMaterialBalance(fen, perspective);
  const perspectiveLabel = perspective === 'white' ? 'White' : 'Black';
  const tooltip = `Material only (${perspectiveLabel} perspective): White ${material.whiteTotal} • Black ${material.blackTotal}`;

  if (material.perspectiveScore === 0) {
    return (
      <div className={`material-indicator material-indicator--equal ${className ?? ''}`.trim()} title={tooltip}>
        <span className="material-label">Material</span>
        <strong className="material-score">=</strong>
      </div>
    );
  }

  return (
    <div
      className={`material-indicator ${className ?? ''}`.trim()}
      title={tooltip}
    >
      <span className="material-label">Material</span>
      <strong className="material-score">{formatSignedValue(material.perspectiveScore)}</strong>
    </div>
  );
};
