import type { PlayerSide } from './perspectiveUtils';

export interface ChessComPlayer {
  username?: string;
  rating?: number;
  result?: string;
}

export interface ChessComGame {
  url: string;
  pgn: string;
  time_class?: string;
  end_time?: number;
  white?: ChessComPlayer;
  black?: ChessComPlayer;
}

export interface ChessComArchivesResponse {
  archives?: string[];
}

export interface ChessComGamesResponse {
  games?: ChessComGame[];
}

export interface SearchedPlayerGameMeta {
  searchedUsername: string;
  playerSide: PlayerSide | null;
}

export const normalizeChessComUsername = (value: string): string => value.trim().toLowerCase();

export const getPlayerSideInGame = (game: ChessComGame, searchedUsername: string): PlayerSide | null => {
  const normalized = normalizeChessComUsername(searchedUsername);
  if (!normalized) {
    return null;
  }

  if (normalizeChessComUsername(game.white?.username ?? '') === normalized) {
    return 'white';
  }
  if (normalizeChessComUsername(game.black?.username ?? '') === normalized) {
    return 'black';
  }

  return null;
};

const formatDate = (epochSeconds?: number): string => {
  if (!epochSeconds) {
    return 'Unknown date';
  }

  return new Date(epochSeconds * 1000).toLocaleString();
};

export const gameLabel = (game: ChessComGame): string => {
  const whiteName = game.white?.username ?? 'White';
  const blackName = game.black?.username ?? 'Black';
  const whiteRating = game.white?.rating ? ` (${game.white.rating})` : '';
  const blackRating = game.black?.rating ? ` (${game.black.rating})` : '';
  const speed = game.time_class ?? 'game';
  return `${whiteName}${whiteRating} vs ${blackName}${blackRating} • ${speed} • ${formatDate(game.end_time)}`;
};
