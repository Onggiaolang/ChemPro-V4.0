
import React, { useState } from 'react';
import { ElementSymbol, BondType, ToolMode } from '../types';
import { ELEMENTS } from '../constants';

interface SidebarProps {
  onUndo: () => void;
  onClear: () => void;
  onGenerateBenzene: () => void;
  onGenerateWater: () => void;
  onGenerateAmmonia: () => void;
  onBuildFromFormula: (formula: string) => void;
  selectedElement: ElementSymbol;
  onSelectElement: (s: ElementSymbol) => void;
  selectedBondType: BondType;
  onSelectBondType: (t: BondType) => void;
  toolMode: ToolMode;
  onSelectTool: (m: ToolMode) => void;
  scale: number;
  onScaleChange: (s: number) => void;
  rotation: number;
  onRotationChange: (r: number) => void;
  isGenerating: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  onUndo, onClear, onGenerateBenzene, onGenerateWater, onGenerateAmmonia, onBuildFromFormula,
  selectedElement, onSelectElement, selectedBondType, onSelectBondType,
  toolMode, onSelectTool, scale, onScaleChange, rotation, onRotationChange,
  isGenerating
}) => {
  const elements: ElementSymbol[] = ['C', 'H', 'O', 'N', 'Cl', 'S', 'P', 'Br'];
  const [formulaInput, setFormulaInput] = useState('');

  const handleExport = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'molecule.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const handleBuildSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formulaInput.trim()) {
      onBuildFromFormula(formulaInput);
    }
  };

  return (
    <aside className="w-80 h-full bg-indigo-950 text-white flex flex-col overflow-y-auto custom-scrollbar shadow-2xl z-20">
      <div className="p-6 bg-indigo-900 border-b border-indigo-800">
        <h1 className="text-2xl font-bold tracking-tight text-blue-300">ChemPro v40</h1>
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-indigo-300 opacity-70 uppercase tracking-widest">Molecular Builder</p>
          <span className="text-[10px] font-bold bg-blue-600/30 text-blue-200 px-2 py-0.5 rounded border border-blue-500/50">GV: VAN HA</span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Section 1: System */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest border-b border-indigo-900 pb-2">Hệ thống & Tự động</h2>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={onUndo} className="flex flex-col items-center justify-center p-2 bg-indigo-900 hover:bg-indigo-800 rounded-lg transition-all border border-indigo-800 active:scale-95">
              <span className="text-xl">🔄</span>
              <span className="text-[10px] mt-1">Hoàn tác</span>
            </button>
            <button onClick={onClear} className="flex flex-col items-center justify-center p-2 bg-red-900/50 hover:bg-red-800/60 rounded-lg transition-all border border-red-900/50 active:scale-95">
              <span className="text-xl">🔥</span>
              <span className="text-[10px] mt-1 text-red-200">Xóa hết</span>
            </button>
            <button onClick={handleExport} className="flex flex-col items-center justify-center p-2 bg-indigo-900 hover:bg-indigo-800 rounded-lg transition-all border border-indigo-800 active:scale-95">
              <span className="text-xl">💾</span>
              <span className="text-[10px] mt-1">Xuất PNG</span>
            </button>
          </div>
        </div>

        {/* Section: Build from Formula */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest border-b border-indigo-900 pb-2">Xây dựng từ Công thức</h2>
          <form onSubmit={handleBuildSubmit} className="space-y-2">
            <div className="relative">
              <input 
                type="text" 
                value={formulaInput}
                onChange={(e) => setFormulaInput(e.target.value)}
                placeholder="VD: C2H5OH, CH3COOH..."
                className="w-full bg-indigo-900 border border-indigo-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-indigo-500"
                disabled={isGenerating}
              />
              <button 
                type="submit"
                disabled={isGenerating || !formulaInput.trim()}
                className="absolute right-1 top-1 bottom-1 px-2 bg-blue-600 hover:bg-blue-500 disabled:bg-indigo-800 disabled:opacity-50 rounded-md text-xs transition-all"
              >
                {isGenerating ? '...' : 'Tạo'}
              </button>
            </div>
            <p className="text-[10px] text-indigo-400 italic">*Nhập công thức phân tử để AI tự vẽ cấu tạo.</p>
          </form>
          <div className="flex gap-2">
            <button onClick={onGenerateBenzene} className="flex-1 py-2 text-xs bg-indigo-800 hover:bg-indigo-700 rounded-md border border-indigo-700">Benzene</button>
            <button onClick={onGenerateWater} className="flex-1 py-2 text-xs bg-indigo-800 hover:bg-indigo-700 rounded-md border border-indigo-700">H₂O</button>
            <button onClick={onGenerateAmmonia} className="flex-1 py-2 text-xs bg-indigo-800 hover:bg-indigo-700 rounded-md border border-indigo-700">NH₃</button>
          </div>
        </div>

        {/* Section 2: Skeleton Frame */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest border-b border-indigo-900 pb-2">Khung xương & Chỉnh sửa</h2>
          <div className="flex gap-2">
            <button onClick={() => onSelectTool('atom')} className={`flex-1 p-2 rounded-lg text-sm border transition-all ${toolMode === 'atom' ? 'bg-blue-600 border-blue-400' : 'bg-indigo-900 border-indigo-800 hover:bg-indigo-800'}`}>Atom</button>
            <button onClick={() => onSelectTool('bond')} className={`flex-1 p-2 rounded-lg text-sm border transition-all ${toolMode === 'bond' ? 'bg-blue-600 border-blue-400' : 'bg-indigo-900 border-indigo-800 hover:bg-indigo-800'}`}>Bond</button>
            <button onClick={() => onSelectTool('eraser')} className={`flex-1 p-2 rounded-lg text-sm border transition-all ${toolMode === 'eraser' ? 'bg-red-600 border-red-400' : 'bg-indigo-900 border-indigo-800 hover:bg-indigo-800'}`}>Xóa</button>
          </div>
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-[10px] text-indigo-300 mb-1">
                <span>Kích thước</span>
                <span>{scale.toFixed(1)}x</span>
              </div>
              <input type="range" min="0.5" max="2" step="0.1" value={scale} onChange={(e) => onScaleChange(parseFloat(e.target.value))} className="w-full accent-blue-500 h-1 rounded-lg cursor-pointer bg-indigo-900" />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-indigo-300 mb-1">
                <span>Xoay</span>
                <span>{rotation}°</span>
              </div>
              <input type="range" min="0" max="360" step="1" value={rotation} onChange={(e) => onRotationChange(parseInt(e.target.value))} className="w-full accent-blue-500 h-1 rounded-lg cursor-pointer bg-indigo-900" />
            </div>
          </div>
        </div>

        {/* Section 3: Periodic Table */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest border-b border-indigo-900 pb-2">Bảng tuần hoàn</h2>
          <div className="grid grid-cols-4 gap-2">
            {elements.map(sym => {
              const el = ELEMENTS[sym];
              const isSelected = selectedElement === sym;
              return (
                <button
                  key={sym}
                  onClick={() => { onSelectElement(sym); onSelectTool('atom'); }}
                  className={`relative group w-full aspect-square flex items-center justify-center rounded-lg font-bold transition-all border-2 ${isSelected ? 'border-white scale-105 shadow-lg shadow-white/10' : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'}`}
                  style={{ backgroundColor: el.color, color: el.textColor }}
                >
                  {sym}
                  {isSelected && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-white"></div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Bond Type */}
        <div className="space-y-3 pb-6">
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest border-b border-indigo-900 pb-2">Loại liên kết</h2>
          <div className="flex gap-2">
            {[
              { type: BondType.SINGLE, label: '—', name: 'Đơn' },
              { type: BondType.DOUBLE, label: '=', name: 'Đôi' },
              { type: BondType.TRIPLE, label: '≡', name: 'Ba' },
            ].map(b => (
              <button
                key={b.type}
                onClick={() => { onSelectBondType(b.type); onSelectTool('bond'); }}
                className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${selectedBondType === b.type ? 'bg-blue-600 border-blue-400' : 'bg-indigo-900 border-indigo-800 hover:bg-indigo-800'}`}
              >
                <span className="text-xl leading-none font-bold">{b.label}</span>
                <span className="text-[10px] mt-1 opacity-70">{b.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
