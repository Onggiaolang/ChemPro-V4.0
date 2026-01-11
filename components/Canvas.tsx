
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Atom, Bond, ElementSymbol, BondType, ToolMode } from '../types';
import { ELEMENTS, ATOM_RADIUS, DEFAULT_BOND_LENGTH } from '../constants';
import { getDistance, snapAngle } from '../utils/chemistry';

interface CanvasProps {
  atoms: Atom[];
  bonds: Bond[];
  toolMode: ToolMode;
  selectedElement: ElementSymbol;
  selectedBondType: BondType;
  onAddAtom: (x: number, y: number, symbol: ElementSymbol) => Atom;
  onAddBond: (a1Id: string, a2Id: string, type: BondType) => void;
  onDelete: (id: string, type: 'atom' | 'bond') => void;
  scale: number;
  rotation: number;
}

const Canvas: React.FC<CanvasProps> = ({
  atoms, bonds, toolMode, selectedElement, selectedBondType,
  onAddAtom, onAddBond, onDelete, scale, rotation
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingBond, setIsDrawingBond] = useState(false);
  const [dragStartAtom, setDragStartAtom] = useState<Atom | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState({ x: 0, y: 0 });
  const [stars] = useState(() => Array.from({ length: 500 }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: Math.random() * 1.2,
    opacity: Math.random() * 0.6
  })));

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    let rx = clientX - rect.left;
    let ry = clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    rx -= centerX;
    ry -= centerY;
    rx /= scale;
    ry /= scale;
    const rad = -(rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const worldX = rx * cos - ry * sin;
    const worldY = rx * sin + ry * cos;

    return { x: worldX + centerX, y: worldY + centerY };
  };

  const findAtomAt = (x: number, y: number) => {
    return atoms.find(atom => getDistance(x, y, atom.x, atom.y) < ATOM_RADIUS * 1.8);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);
    const atomAtMouse = findAtomAt(x, y);

    if (toolMode === 'eraser') {
      if (atomAtMouse) onDelete(atomAtMouse.id, 'atom');
      return;
    }

    if (atomAtMouse) {
      setIsDrawingBond(true);
      setDragStartAtom(atomAtMouse);
    } else if (toolMode === 'atom') {
      onAddAtom(x, y, selectedElement);
    }
    setCurrentMousePos({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);
    setCurrentMousePos({ x, y });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawingBond || !dragStartAtom) {
      setIsDrawingBond(false);
      setDragStartAtom(null);
      return;
    }

    const { x, y } = getCanvasCoords(e);
    const atomAtMouse = findAtomAt(x, y);

    if (atomAtMouse && atomAtMouse.id !== dragStartAtom.id) {
      onAddBond(dragStartAtom.id, atomAtMouse.id, selectedBondType);
    } else if (!atomAtMouse) {
      const dx = x - dragStartAtom.x;
      const dy = y - dragStartAtom.y;
      const angle = Math.atan2(dy, dx);
      const snapped = snapAngle(angle);
      const dist = Math.max(DEFAULT_BOND_LENGTH, getDistance(x, y, dragStartAtom.x, dragStartAtom.y));
      
      const newX = dragStartAtom.x + dist * Math.cos(snapped);
      const newY = dragStartAtom.y + dist * Math.sin(snapped);
      
      const newAtom = onAddAtom(newX, newY, selectedElement);
      onAddBond(dragStartAtom.id, newAtom.id, selectedBondType);
    }

    setIsDrawingBond(false);
    setDragStartAtom(null);
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const bgGrad = ctx.createRadialGradient(rect.width/2, rect.height/2, 0, rect.width/2, rect.height/2, rect.width);
    bgGrad.addColorStop(0, '#1e293b'); 
    bgGrad.addColorStop(1, '#0f172a'); 
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, rect.width, rect.height);

    stars.forEach(star => {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      ctx.beginPath();
      ctx.arc(star.x * rect.width, star.y * rect.height, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1 / scale;
    const gridStep = 80;
    const viewSize = Math.max(rect.width, rect.height) * 4;
    for (let i = -viewSize; i < viewSize; i += gridStep) {
      ctx.beginPath(); ctx.moveTo(i, -viewSize); ctx.lineTo(i, viewSize); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-viewSize, i); ctx.lineTo(viewSize, i); ctx.stroke();
    }

    bonds.forEach(bond => {
      const a1 = atoms.find(a => a.id === bond.atom1Id);
      const a2 = atoms.find(a => a.id === bond.atom2Id);
      if (!a1 || !a2) return;

      ctx.strokeStyle = 'rgba(100, 116, 139, 0.7)';
      ctx.lineCap = 'round';
      const baseWidth = 2.5 / scale; 

      ctx.beginPath();
      if (bond.type === BondType.SINGLE) {
        ctx.lineWidth = baseWidth;
        ctx.moveTo(a1.x, a1.y); ctx.lineTo(a2.x, a2.y);
      } else if (bond.type === BondType.DOUBLE) {
        const dx = a2.x - a1.x; const dy = a2.y - a1.y; const len = Math.sqrt(dx*dx + dy*dy);
        const ox = -dy/len * (baseWidth * 1.8); const oy = dx/len * (baseWidth * 1.8);
        ctx.lineWidth = baseWidth;
        ctx.moveTo(a1.x + ox, a1.y + oy); ctx.lineTo(a2.x + ox, a2.y + oy);
        ctx.moveTo(a1.x - ox, a1.y - oy); ctx.lineTo(a2.x - ox, a2.y - oy);
      } else if (bond.type === BondType.TRIPLE) {
        const dx = a2.x - a1.x; const dy = a2.y - a1.y; const len = Math.sqrt(dx*dx + dy*dy);
        const ox = -dy/len * (baseWidth * 3.2); const oy = dx/len * (baseWidth * 3.2);
        ctx.lineWidth = baseWidth;
        ctx.moveTo(a1.x, a1.y); ctx.lineTo(a2.x, a2.y);
        ctx.moveTo(a1.x + ox, a1.y + oy); ctx.lineTo(a2.x + ox, a2.y + oy);
        ctx.moveTo(a1.x - ox, a1.y - oy); ctx.lineTo(a2.x - ox, a2.y - oy);
      }
      ctx.stroke();
    });

    atoms.forEach(atom => {
      const el = ELEMENTS[atom.symbol] || { color: '#ffffff' };
      const radius = ATOM_RADIUS;

      ctx.save();
      ctx.shadowBlur = 15 / scale; 
      ctx.shadowColor = el.color || 'white';
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a'; 
      ctx.fill();
      
      ctx.strokeStyle = el.color || '#ffffff';
      ctx.lineWidth = 1 / scale; 
      ctx.stroke();

      const grad = ctx.createRadialGradient(atom.x - radius * 0.3, atom.y - radius * 0.3, radius * 0.1, atom.x, atom.y, radius);
      grad.addColorStop(0, el.color || '#ffffff');
      grad.addColorStop(0.5, 'rgba(0,0,0,0.2)');
      grad.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.restore();

      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${7}px Inter, sans-serif`; 
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(atom.symbol, atom.x, atom.y);
    });

    if (isDrawingBond && dragStartAtom) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 1 / scale;
      ctx.beginPath();
      ctx.moveTo(dragStartAtom.x, dragStartAtom.y);
      ctx.lineTo(currentMousePos.x, currentMousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [atoms, bonds, isDrawingBond, dragStartAtom, currentMousePos, scale, rotation, stars]);

  useEffect(() => {
    let frameId: number;
    const loop = () => {
      draw();
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [draw]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-full cursor-crosshair touch-none"
      />
    </div>
  );
};

export default Canvas;
