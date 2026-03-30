import { OPENING_LINES, type OpeningLineEntry } from './openingLines';

export interface OpeningBookMatch {
  ecoCode: string;
  openingName: string;
  line: string[];
}

export interface OpeningBookProvider {
  findBySanPrefix: (normalizedSanPrefix: string[]) => OpeningBookMatch | null;
}

const isPrefixMatch = (line: OpeningLineEntry, normalizedPrefix: string[]): boolean => {
  if (normalizedPrefix.length > line.moves.length) {
    return false;
  }

  for (let i = 0; i < normalizedPrefix.length; i += 1) {
    if ((line.moves[i] ?? '') !== normalizedPrefix[i]) {
      return false;
    }
  }

  return true;
};

const toMatch = (entry: OpeningLineEntry): OpeningBookMatch => ({
  ecoCode: entry.eco,
  openingName: entry.name,
  line: entry.moves,
});

export const staticOpeningLinesProvider: OpeningBookProvider = {
  findBySanPrefix: (normalizedSanPrefix) => {
    const candidates = OPENING_LINES.filter((line) => isPrefixMatch(line, normalizedSanPrefix));
    if (!candidates.length) {
      return null;
    }

    // Most specific line wins.
    const best = [...candidates].sort((a, b) => b.moves.length - a.moves.length)[0];
    return best ? toMatch(best) : null;
  },
};

