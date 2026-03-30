import { Chess } from 'chess.js';
import { staticOpeningLinesProvider, type OpeningBookProvider } from './openingBookProvider';

export interface BookDetectionResult {
  isBook: boolean;
  openingName: string | null;
  ecoCode: string | null;
  bookSource: string | null;
  matchedLine: string[] | null;
  matchedPrefixLength: number | null;
}

export interface BookMoveContext {
  startingFen: string;
  fenBefore: string;
  playedMoveUci: string;
  playedMoveSan: string;
  movesSanPrefix: string[];
  plyIndex: number;
}

export interface BookMoveDetector {
  detectMove: (context: BookMoveContext) => BookDetectionResult;
}

const START_FEN = new Chess().fen();

const normalizeSanForBook = (san: string): string => {
  const trimmed = san.trim();

  // Normalize castling token variants first.
  const castlingNormalized = trimmed.replace(/^0-0-0$/, 'O-O-O').replace(/^0-0$/, 'O-O');

  return castlingNormalized
    .replace(/\$\d+/g, '') // strip NAG codes like $1
    .replace(/[!?]+/g, '') // strip annotation glyphs
    .replace(/[+#]+$/g, '') // strip check/mate suffixes
    .replace(/\s*e\.?p\.?$/i, '') // strip optional en-passant suffix
    .trim();
};

export const createBookMoveDetector = (provider: OpeningBookProvider): BookMoveDetector => ({
  detectMove: ({ startingFen, movesSanPrefix }: BookMoveContext): BookDetectionResult => {
    if (startingFen !== START_FEN || movesSanPrefix.length === 0) {
      return {
        isBook: false,
        openingName: null,
        ecoCode: null,
        bookSource: null,
        matchedLine: null,
        matchedPrefixLength: null,
      };
    }

    const normalizedPrefix = movesSanPrefix.map(normalizeSanForBook);
    const match = provider.findBySanPrefix(normalizedPrefix);

    if (!match) {
      return {
        isBook: false,
        openingName: null,
        ecoCode: null,
        bookSource: null,
        matchedLine: null,
        matchedPrefixLength: null,
      };
    }

    return {
      isBook: true,
      openingName: match.openingName,
      ecoCode: match.ecoCode,
      bookSource: 'opening-lines-v1',
      matchedLine: match.line,
      matchedPrefixLength: normalizedPrefix.length,
    };
  },
});

/**
 * Dataset-driven opening-prefix matcher.
 *
 * - Uses SAN move-sequence prefixes (start position only) to determine if the game
 *   is still in known opening theory.
 * - If multiple lines match, prefers the longest/specific line.
 */
export const defaultBookMoveDetector: BookMoveDetector = createBookMoveDetector(staticOpeningLinesProvider);
