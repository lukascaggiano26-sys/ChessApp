import { enforceBestLabelBoundary } from '../src/components/chess/game/moveReviewBestBoundary.ts';

type Fixture = {
  name: string;
  fenBefore: string;
  playedUci: string;
  bestMoveUci: string | null;
  baseLabel: 'Best' | 'Excellent' | 'Good' | null;
  expectedLabel: 'Best' | 'Excellent' | 'Good' | null;
};

const fixtures: Fixture[] = [
  {
    name: 'after 1.e4, ...e6 is not Best when engine best is ...c5',
    fenBefore: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    playedUci: 'e7e6',
    bestMoveUci: 'c7c5',
    baseLabel: 'Best',
    expectedLabel: 'Excellent',
  },
  {
    name: 'exact engine-best move remains Best',
    fenBefore: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    playedUci: 'e2e4',
    bestMoveUci: 'e2e4',
    baseLabel: 'Best',
    expectedLabel: 'Best',
  },
  {
    name: 'near-best but non-identical is Excellent',
    fenBefore: 'r1bqkbnr/pppppppp/n7/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    playedUci: 'g8f6',
    bestMoveUci: 'd7d5',
    baseLabel: 'Best',
    expectedLabel: 'Excellent',
  },
  {
    name: 'mate-score exact best still Best',
    fenBefore: '6k1/5Q2/6K1/8/8/8/8/8 w - - 0 1',
    playedUci: 'f7g7',
    bestMoveUci: 'f7g7',
    baseLabel: 'Best',
    expectedLabel: 'Best',
  },
];

for (const fixture of fixtures) {
  const actual = enforceBestLabelBoundary({
    baseLabel: fixture.baseLabel,
    playedUci: fixture.playedUci,
    bestMoveUci: fixture.bestMoveUci,
  });
  if (actual !== fixture.expectedLabel) {
    throw new Error(
      `[${fixture.name}] expected ${fixture.expectedLabel ?? 'null'} but got ${actual ?? 'null'} (fen=${fixture.fenBefore})`,
    );
  }
}

console.log(`move-review Best boundary checks passed (${fixtures.length} fixtures)`);
