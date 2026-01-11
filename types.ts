
export type ElementSymbol = 'H' | 'He' | 'Li' | 'Be' | 'B' | 'C' | 'N' | 'O' | 'F' | 'Ne' | 'Na' | 'Mg' | 'Al' | 'Si' | 'P' | 'S' | 'Cl' | 'Ar' | 'K' | 'Ca' | 'Fe' | 'Cu' | 'Ag' | 'Au' | 'Hg' | 'U' | 'Br';

export enum ElementCategory {
  DIATOMIC_NONMETAL = 'DIATOMIC_NONMETAL',
  NOBLE_GAS = 'NOBLE_GAS',
  ALKALI_METAL = 'ALKALI_METAL',
  ALKALINE_EARTH_METAL = 'ALKALINE_EARTH_METAL',
  METALLOID = 'METALLOID',
  POLYATOMIC_NONMETAL = 'POLYATOMIC_NONMETAL',
  POST_TRANSITION_METAL = 'POST_TRANSITION_METAL',
  TRANSITION_METAL = 'TRANSITION_METAL',
  LANTHANIDE = 'LANTHANIDE',
  ACTINIDE = 'ACTINIDE',
  UNKNOWN = 'UNKNOWN',
}

export interface ElementData {
  symbol: ElementSymbol;
  color?: string;
  textColor?: string;
  valence?: number[];
  number?: number;
  name?: string;
  atomic_mass?: number;
  category?: ElementCategory;
  xpos?: number;
  ypos?: number;
  summary?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  sources?: { uri: string; title?: string }[];
}

export interface FlowerIdentification {
  name: string;
  scientificName: string;
  family: string;
  origin: string;
  meaning: string;
  careGuide: {
    watering: string;
    sunlight: string;
    soil: string;
    temperature: string;
  };
  interestingFacts: string[];
}

export enum BondType {
  SINGLE = 1,
  DOUBLE = 2,
  TRIPLE = 3
}

export interface Atom {
  id: string;
  symbol: ElementSymbol;
  x: number;
  y: number;
}

export interface Bond {
  id: string;
  atom1Id: string;
  atom2Id: string;
  type: BondType;
}

export interface AppState {
  atoms: Atom[];
  bonds: Bond[];
}

export type ToolMode = 'select' | 'atom' | 'bond' | 'eraser';
export type ViewMode = '2D' | '3D';
