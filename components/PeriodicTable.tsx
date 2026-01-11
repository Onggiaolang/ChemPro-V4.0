
import React, { useState } from 'react';
import { elements } from '../data/elements';
import { ElementData, ElementCategory } from '../types';

const categoryColors: Record<ElementCategory, string> = {
  [ElementCategory.DIATOMIC_NONMETAL]: 'bg-blue-900 border-blue-400 text-blue-100',
  [ElementCategory.NOBLE_GAS]: 'bg-purple-900 border-purple-400 text-purple-100',
  [ElementCategory.ALKALI_METAL]: 'bg-red-900 border-red-400 text-red-100',
  [ElementCategory.ALKALINE_EARTH_METAL]: 'bg-orange-900 border-orange-400 text-orange-100',
  [ElementCategory.METALLOID]: 'bg-teal-900 border-teal-400 text-teal-100',
  [ElementCategory.POLYATOMIC_NONMETAL]: 'bg-green-900 border-green-400 text-green-100',
  [ElementCategory.POST_TRANSITION_METAL]: 'bg-gray-800 border-gray-400 text-gray-100',
  [ElementCategory.TRANSITION_METAL]: 'bg-yellow-900 border-yellow-400 text-yellow-100',
  [ElementCategory.LANTHANIDE]: 'bg-pink-900 border-pink-400 text-pink-100',
  [ElementCategory.ACTINIDE]: 'bg-rose-900 border-rose-400 text-rose-100',
  [ElementCategory.UNKNOWN]: 'bg-slate-700 border-slate-400 text-slate-100',
};

const PeriodicTable: React.FC = () => {
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);

  const renderElement = (element: ElementData) => {
    return (
      <div
        key={element.number}
        onClick={() => setSelectedElement(element)}
        className={`flex flex-col items-center justify-center p-1 border-2 rounded cursor-pointer transition-transform hover:scale-105 ${categoryColors[element.category]}`}
        style={{
          gridColumn: element.xpos,
          gridRow: element.ypos,
          aspectRatio: '1/1'
        }}
      >
        <span className="text-[10px] leading-tight">{element.number}</span>
        <span className="text-lg font-bold leading-tight">{element.symbol}</span>
        <span className="text-[8px] truncate max-w-full">{element.name}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="overflow-x-auto pb-4">
        <div className="periodic-grid min-w-[800px]">
          {elements.map(renderElement)}
        </div>
      </div>

      {selectedElement && (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <span className={`px-4 py-1 rounded ${categoryColors[selectedElement.category]}`}>
                  {selectedElement.symbol}
                </span>
                {selectedElement.name}
              </h2>
              <p className="text-slate-400 capitalize mt-1">{selectedElement.category.replace(/_/g, ' ')}</p>
            </div>
            <button 
              onClick={() => setSelectedElement(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-slate-900/50 p-3 rounded">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Atomic Number</p>
                <p className="text-xl font-mono">{selectedElement.number}</p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Atomic Mass</p>
                <p className="text-xl font-mono">{selectedElement.atomic_mass} u</p>
              </div>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Description</p>
              <p className="text-slate-200 leading-relaxed text-sm">
                {selectedElement.summary}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodicTable;
