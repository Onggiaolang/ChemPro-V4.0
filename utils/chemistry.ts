
import { Atom, Bond, ElementSymbol, BondType } from '../types';
import { ELEMENTS } from '../constants';

/**
 * Calculates the current valence of an atom based on its bonds.
 */
export const calculateValence = (atomId: string, bonds: Bond[]): number => {
  return bonds
    .filter(b => b.atom1Id === atomId || b.atom2Id === atomId)
    .reduce((sum, b) => sum + (b.type as number), 0);
};

/**
 * Checks if any atom violates standard valence rules.
 */
export const checkValenceViolations = (atoms: Atom[], bonds: Bond[]): string[] => {
  const violations: string[] = [];
  atoms.forEach(atom => {
    const currentValence = calculateValence(atom.id, bonds);
    const element = ELEMENTS[atom.symbol];
    if (!element.valence.includes(currentValence)) {
      const maxValence = Math.max(...element.valence);
      if (currentValence > maxValence) {
        violations.push(`Nguyên tử ${atom.symbol} (${atom.id.slice(0, 4)}) vượt quá hóa trị tối đa (${maxValence}).`);
      }
    }
  });
  return violations;
};

/**
 * Snap angle to nearest chemical bond angle.
 */
export const snapAngle = (angleRad: number): number => {
  const angleDeg = (angleRad * 180) / Math.PI;
  const normalizedDeg = ((angleDeg % 360) + 360) % 360;
  
  const snapAngles = [0, 30, 60, 90, 109.5, 120, 180, 240, 270, 300, 330, 360];
  let closest = snapAngles[0];
  let minDiff = Math.abs(normalizedDeg - snapAngles[0]);

  snapAngles.forEach(snap => {
    const diff = Math.abs(normalizedDeg - snap);
    if (diff < minDiff) {
      minDiff = diff;
      closest = snap;
    }
  });

  return (closest * Math.PI) / 180;
};

export const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};
