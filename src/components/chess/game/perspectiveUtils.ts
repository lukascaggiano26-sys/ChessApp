import type { BoardOrientation } from '../board';

export type PlayerSide = 'white' | 'black';

export const toPlayerSide = (color: 'w' | 'b' | PlayerSide): PlayerSide =>
  color === 'w' || color === 'white' ? 'white' : 'black';

export const getOrientationFromPlayerColor = (color: PlayerSide): BoardOrientation => color;

export const getPerspectiveColor = (orientation: BoardOrientation): PlayerSide =>
  orientation === 'white' ? 'white' : 'black';
