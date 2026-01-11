
import { ElementData } from './types';

export const ELEMENTS: Record<string, ElementData> = {
  C: { symbol: 'C', color: '#111111', textColor: '#ffffff', valence: [4] }, 
  H: { symbol: 'H', color: '#f0f0f0', textColor: '#0f172a', valence: [1] }, 
  O: { symbol: 'O', color: '#ff1e1e', textColor: '#ffffff', valence: [2] }, 
  N: { symbol: 'N', color: '#1e90ff', textColor: '#ffffff', valence: [3] }, 
  Cl: { symbol: 'Cl', color: '#32cd32', textColor: '#ffffff', valence: [1] },
  S: { symbol: 'S', color: '#ffd700', textColor: '#1e293b', valence: [2, 4, 6] },
  P: { symbol: 'P', color: '#ff8c00', textColor: '#ffffff', valence: [3, 5] },
  Br: { symbol: 'Br', color: '#a52a2a', textColor: '#ffffff', valence: [1] }
};

export const ATOM_RADIUS = 10; 
export const SNAP_DISTANCE = 15;
export const BOND_SNAP_ANGLES = [0, 30, 45, 60, 90, 109.5, 120, 180, 240, 270, 300];
export const DEFAULT_BOND_LENGTH = 35;
