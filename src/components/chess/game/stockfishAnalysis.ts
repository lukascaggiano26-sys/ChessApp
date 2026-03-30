import type { LastMove, Square } from '../board';

export type EvaluationType = 'cp' | 'mate';
export type EvaluationPerspective = 'white';

export interface StockfishEvaluation {
  type: EvaluationType;
  value: number;
  display: string;
  perspective: EvaluationPerspective;
}

export interface ParsedInfoLine {
  depth: number | null;
  evaluation: StockfishEvaluation | null;
}

const BESTMOVE_RE = /^bestmove\s([a-h][1-8][a-h][1-8])\b/i;
const DEPTH_RE = /\bdepth\s(\d+)\b/i;
const SCORE_CP_RE = /\bscore\scp\s(-?\d+)\b/i;
const SCORE_MATE_RE = /\bscore\smate\s(-?\d+)\b/i;

const sideToMoveFromFen = (fen: string): 'w' | 'b' => {
  const parts = fen.trim().split(/\s+/);
  return parts[1] === 'b' ? 'b' : 'w';
};

const formatCpDisplay = (centipawns: number): string => {
  const pawns = centipawns / 100;
  const sign = pawns > 0 ? '+' : '';
  return `${sign}${pawns.toFixed(1)}`;
};

const formatMateDisplay = (mateIn: number): string => {
  if (mateIn === 0) {
    return 'M0';
  }

  return mateIn > 0 ? `M${mateIn}` : `-M${Math.abs(mateIn)}`;
};

const normalizeToWhitePerspective = (value: number, fen: string): number => {
  const sideToMove = sideToMoveFromFen(fen);
  return sideToMove === 'w' ? value : -value;
};

export const parseBestMove = (line: string): LastMove | null => {
  const match = BESTMOVE_RE.exec(line.trim());
  if (!match) {
    return null;
  }

  const uciMove = match[1];
  return {
    from: uciMove.slice(0, 2) as Square,
    to: uciMove.slice(2, 4) as Square,
  };
};

export const parseInfoLine = (line: string, fen: string): ParsedInfoLine | null => {
  const trimmed = line.trim();
  if (!trimmed.startsWith('info ')) {
    return null;
  }

  const depthMatch = DEPTH_RE.exec(trimmed);
  const depth = depthMatch ? Number.parseInt(depthMatch[1], 10) : null;

  const mateMatch = SCORE_MATE_RE.exec(trimmed);
  if (mateMatch) {
    const raw = Number.parseInt(mateMatch[1], 10);
    const normalized = normalizeToWhitePerspective(raw, fen);
    return {
      depth,
      evaluation: {
        type: 'mate',
        value: normalized,
        display: formatMateDisplay(normalized),
        perspective: 'white',
      },
    };
  }

  const cpMatch = SCORE_CP_RE.exec(trimmed);
  if (cpMatch) {
    const raw = Number.parseInt(cpMatch[1], 10);
    const normalized = normalizeToWhitePerspective(raw, fen);
    return {
      depth,
      evaluation: {
        type: 'cp',
        value: normalized,
        display: formatCpDisplay(normalized),
        perspective: 'white',
      },
    };
  }

  return {
    depth,
    evaluation: null,
  };
};
