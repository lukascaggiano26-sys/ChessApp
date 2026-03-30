import { Chess } from 'chess.js';

export interface BookDetectionResult {
  isBook: boolean;
  openingName: string | null;
  ecoCode: string | null;
  bookSource: string | null;
}

export interface BookMoveContext {
  fenBefore: string;
  playedMoveUci: string;
  plyIndex: number;
}

export interface BookMoveDetector {
  detectMove: (context: BookMoveContext) => BookDetectionResult;
}

interface StaticBookEntry {
  openingName: string;
  ecoCode: string;
}

const START_FEN = new Chess().fen();

const keyFor = (fenBefore: string, playedMoveUci: string): string => `${fenBefore}::${playedMoveUci}`;

const staticBookMap = new Map<string, StaticBookEntry>([
  [keyFor(START_FEN, 'e2e4'), { openingName: 'King Pawn Game', ecoCode: 'C20' }],
  [keyFor(START_FEN, 'd2d4'), { openingName: 'Queen Pawn Game', ecoCode: 'D00' }],
  [keyFor(START_FEN, 'c2c4'), { openingName: 'English Opening', ecoCode: 'A10' }],
  [keyFor(START_FEN, 'g1f3'), { openingName: 'Reti Opening', ecoCode: 'A04' }],
]);

/**
 * Conservative fallback detector.
 *
 * - No bundled large opening dataset.
 * - Only labels highly trusted start-position first moves.
 * - Pluggable via `BookMoveDetector` so richer ECO/explorer data can be added later.
 */
export const defaultBookMoveDetector: BookMoveDetector = {
  detectMove: ({ fenBefore, playedMoveUci, plyIndex }: BookMoveContext): BookDetectionResult => {
    if (plyIndex > 0) {
      return {
        isBook: false,
        openingName: null,
        ecoCode: null,
        bookSource: null,
      };
    }

    const entry = staticBookMap.get(keyFor(fenBefore, playedMoveUci));
    if (!entry) {
      return {
        isBook: false,
        openingName: null,
        ecoCode: null,
        bookSource: null,
      };
    }

    return {
      isBook: true,
      openingName: entry.openingName,
      ecoCode: entry.ecoCode,
      bookSource: 'static-openings-v0',
    };
  },
};
