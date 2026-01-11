
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import Molecule3D from './components/Molecule3D';
import { Atom, Bond, ElementSymbol, BondType, AppState, ToolMode, ViewMode } from './types';
import { ELEMENTS, DEFAULT_BOND_LENGTH } from './constants';
import { checkValenceViolations } from './utils/chemistry';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { BookOpen, Layers, Box, Info, Sparkles, Volume2, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [atoms, setAtoms] = useState<Atom[]>([]);
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [history, setHistory] = useState<AppState[]>([]);
  const [selectedElement, setSelectedElement] = useState<ElementSymbol>('C');
  const [selectedBondType, setSelectedBondType] = useState<BondType>(BondType.SINGLE);
  const [toolMode, setToolMode] = useState<ToolMode>('atom');
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isNaming, setIsNaming] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [moleculeName, setMoleculeName] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('2D');
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const saveToHistory = useCallback(() => {
    setHistory(prev => [...prev, { atoms: [...atoms], bonds: [...bonds] }].slice(-20));
  }, [atoms, bonds]);

  const undo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setAtoms(previous.atoms);
    setBonds(previous.bonds);
    setHistory(prev => prev.slice(0, -1));
    setMoleculeName(null);
  };

  const clearAll = () => {
    saveToHistory();
    setAtoms([]);
    setBonds([]);
    setMoleculeName(null);
  };

  const handleAddAtom = (x: number, y: number, symbol: ElementSymbol) => {
    saveToHistory();
    const newAtom: Atom = {
      id: Math.random().toString(36).substr(2, 9),
      symbol,
      x,
      y
    };
    setAtoms(prev => [...prev, newAtom]);
    setMoleculeName(null);
    return newAtom;
  };

  const handleAddBond = (atom1Id: string, atom2Id: string, type: BondType) => {
    if (bonds.some(b => (b.atom1Id === atom1Id && b.atom2Id === atom2Id) || (b.atom1Id === atom2Id && b.atom1Id === atom2Id))) {
      setBonds(prev => prev.map(b => 
        ((b.atom1Id === atom1Id && b.atom2Id === atom2Id) || (b.atom1Id === atom2Id && b.atom2Id === atom1Id))
        ? { ...b, type } : b
      ));
      return;
    }
    saveToHistory();
    const newBond: Bond = {
      id: Math.random().toString(36).substr(2, 9),
      atom1Id,
      atom2Id,
      type
    };
    setBonds(prev => [...prev, newBond]);
    setMoleculeName(null);
  };

  const handleDelete = (id: string, type: 'atom' | 'bond') => {
    saveToHistory();
    if (type === 'atom') {
      setAtoms(prev => prev.filter(a => a.id !== id));
      setBonds(prev => prev.filter(b => b.atom1Id !== id && b.atom2Id !== id));
    } else {
      setBonds(prev => prev.filter(b => b.id !== id));
    }
    setMoleculeName(null);
  };

  // Naming logic based on Vietnam GDPT 2018 (Kết nối tri thức)
  const handleIdentifyMolecule = async () => {
    if (atoms.length === 0) return;
    setIsNaming(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const structureInfo = {
        atoms: atoms.map(a => ({ symbol: a.symbol })),
        bonds: bonds.map(b => {
          const a1 = atoms.find(at => at.id === b.atom1Id);
          const a2 = atoms.find(at => at.id === b.atom2Id);
          return { from: a1?.symbol, to: a2?.symbol, type: b.type };
        })
      };

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Xác định tên phân tử theo danh pháp IUPAC tiếng Anh chuẩn SGK Hóa học Kết nối tri thức 2018: ${JSON.stringify(structureInfo)}.
        CHÚ Ý:
        1. Sử dụng tên tiếng Anh (vd: Ethanol, Methanamine, Ethanoic acid).
        2. Nếu là hợp chất hữu cơ, ưu tiên tên thay thế (vd: Propan-2-ol).
        3. Chỉ trả về chuỗi tên, không kèm giải thích.`,
      });
      setMoleculeName(response.text?.trim() || "Unknown Molecule");
    } catch (error) {
      console.error("Naming error:", error);
      setMoleculeName("Error");
    } finally {
      setIsNaming(false);
    }
  };

  // Text-to-Speech implementation using Gemini TTS
  const handleSpeakName = async () => {
    if (!moleculeName || isSpeaking) return;
    setIsSpeaking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say clearly: ${moleculeName}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("TTS error:", error);
      setIsSpeaking(false);
    }
  };

  // Helper functions for audio
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  };

  const handleBuildFromFormula = async (formula: string) => {
    if (!formula.trim()) return;
    setIsGenerating(true);
    setMoleculeName(null);
    saveToHistory();

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Create 2D coordinates for "${formula}". Use IUPAC English name (Vietnam GDPT 2018 standards).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              atoms: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    symbol: { type: Type.STRING },
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER }
                  },
                  required: ["symbol", "x", "y"]
                }
              },
              bonds: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    a1Index: { type: Type.INTEGER },
                    a2Index: { type: Type.INTEGER },
                    type: { type: Type.INTEGER }
                  },
                  required: ["a1Index", "a2Index", "type"]
                }
              }
            },
            required: ["atoms", "bonds", "name"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      if (!data.atoms) throw new Error("No atoms");

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      data.atoms.forEach((a: any) => {
        minX = Math.min(minX, a.x); maxX = Math.max(maxX, a.x);
        minY = Math.min(minY, a.y); maxY = Math.max(maxY, a.y);
      });

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const range = Math.max(maxX - minX, maxY - minY, 1);
      const targetSize = 160; 
      const multiplier = targetSize / range;

      const newAtoms: Atom[] = data.atoms.map((a: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        symbol: a.symbol as ElementSymbol,
        x: 400 + (a.x - centerX) * multiplier,
        y: 300 + (a.y - centerY) * multiplier
      }));

      const newBonds: Bond[] = data.bonds.map((b: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        atom1Id: newAtoms[b.a1Index].id,
        atom2Id: newAtoms[b.a2Index].id,
        type: b.type as BondType
      }));

      setAtoms(newAtoms);
      setBonds(newBonds);
      setMoleculeName(data.name);
      setScale(1.0); 
      setRotation(0);
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    setWarnings(checkValenceViolations(atoms, bonds));
    // Auto-identify name after some delay if drawn manually
    const timer = setTimeout(() => {
      if (atoms.length > 0 && !moleculeName && !isNaming) {
        handleIdentifyMolecule();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [atoms, bonds]);

  return (
    <div className="flex h-screen w-full bg-[#0f172a] overflow-hidden text-slate-100 font-sans">
      <Sidebar 
        onUndo={undo}
        onClear={clearAll}
        onBuildFromFormula={handleBuildFromFormula}
        onGenerateBenzene={() => handleBuildFromFormula('Benzene')}
        onGenerateWater={() => handleBuildFromFormula('Water')}
        onGenerateAmmonia={() => handleBuildFromFormula('Ammonia')}
        selectedElement={selectedElement}
        onSelectElement={setSelectedElement}
        selectedBondType={selectedBondType}
        onSelectBondType={setSelectedBondType}
        toolMode={toolMode}
        onSelectTool={setToolMode}
        scale={scale}
        onScaleChange={setScale}
        rotation={rotation}
        onRotationChange={setRotation}
        isGenerating={isGenerating}
      />

      <div className="flex-1 relative flex flex-col h-full">
        {/* Molecule Information Panel */}
        <div className="absolute top-8 left-8 z-40">
          <div className="bg-slate-900/80 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] flex items-center gap-6 border-l-[12px] border-l-cyan-500">
            <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/30">
              <BookOpen className="text-cyan-400" size={36} />
            </div>
            <div className="min-w-[120px]">
              <p className="text-[11px] text-cyan-400/70 font-black uppercase tracking-[0.4em] mb-1">SGK KẾT NỐI TRI THỨC</p>
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-black text-white tracking-tighter capitalize drop-shadow-2xl">
                  {isNaming ? (
                    <div className="flex items-center gap-2 text-xl opacity-50">
                      <Loader2 className="animate-spin" size={20} /> Đang định danh...
                    </div>
                  ) : (moleculeName || "Mô Hình Phân Tử")}
                </h2>
                {moleculeName && !isNaming && (
                  <button 
                    onClick={handleSpeakName}
                    disabled={isSpeaking}
                    className={`p-2 rounded-full transition-all ${isSpeaking ? 'bg-cyan-500 text-slate-950 scale-110 shadow-[0_0_20px_rgba(6,182,212,0.6)]' : 'bg-white/5 hover:bg-white/10 text-cyan-400'}`}
                  >
                    <Volume2 size={24} className={isSpeaking ? 'animate-pulse' : ''} />
                  </button>
                )}
              </div>
            </div>
            {atoms.length > 0 && !moleculeName && !isNaming && (
              <button 
                onClick={handleIdentifyMolecule}
                className="ml-6 px-8 py-3 bg-cyan-500 text-slate-950 font-black text-xs rounded-2xl hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.5)] active:scale-95 flex items-center gap-2"
              >
                <Sparkles size={16} /> NHẬN DIỆN
              </button>
            )}
          </div>
        </div>

        <div className="absolute bottom-12 left-12 z-50">
          <div className="bg-slate-950/80 backdrop-blur-3xl p-3 rounded-[4rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.9)] flex gap-3">
            <button 
              onClick={() => setViewMode('2D')}
              className={`flex items-center gap-4 px-12 py-6 rounded-[3rem] transition-all duration-700 ${viewMode === '2D' ? 'bg-cyan-500 text-slate-950 shadow-[0_0_50px_rgba(6,182,212,0.7)] scale-110' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            >
              <Layers size={24} className={viewMode === '2D' ? 'text-slate-950' : 'text-slate-500'} />
              <span className="font-black text-sm uppercase tracking-[0.2em]">HÌNH 2D</span>
            </button>
            <button 
              onClick={() => setViewMode('3D')}
              className={`flex items-center gap-4 px-12 py-6 rounded-[3rem] transition-all duration-700 ${viewMode === '3D' ? 'bg-cyan-500 text-slate-950 shadow-[0_0_50px_rgba(6,182,212,0.7)] scale-110' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            >
              <Box size={24} className={viewMode === '3D' ? 'text-slate-950' : 'text-slate-500'} />
              <span className="font-black text-sm uppercase tracking-[0.2em]">HÌNH 3D</span>
            </button>
          </div>
        </div>

        <div className="flex-1 h-full w-full">
          {viewMode === '2D' ? (
            <Canvas 
              atoms={atoms}
              bonds={bonds}
              toolMode={toolMode}
              selectedElement={selectedElement}
              selectedBondType={selectedBondType}
              onAddAtom={handleAddAtom}
              onAddBond={handleAddBond}
              onDelete={handleDelete}
              scale={scale}
              rotation={rotation}
            />
          ) : (
            <Molecule3D atoms={atoms} bonds={bonds} />
          )}
        </div>

        {warnings.length > 0 && viewMode === '2D' && (
          <div className="absolute top-8 right-8 z-50 flex flex-col gap-3">
            {warnings.map((w, i) => (
              <div key={i} className="bg-rose-500/90 backdrop-blur-xl text-white px-8 py-5 rounded-3xl shadow-2xl border border-rose-400/30 flex items-center gap-4 animate-in slide-in-from-right duration-500">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Info size={20} />
                </div>
                <span className="text-sm font-black uppercase tracking-wide">{w}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
