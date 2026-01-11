
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Zap } from 'lucide-react';

const EquationBalancer: React.FC = () => {
  const [equation, setEquation] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const balanceEquation = async () => {
    if (!equation.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Initialize GoogleGenAI with the required named parameter
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        // Using gemini-3-pro-preview for complex STEM tasks like chemical equation balancing
        model: 'gemini-3-pro-preview',
        contents: `Balance this chemical equation: ${equation}. 
        Provide only the balanced equation as a string first, followed by a brief 1-sentence explanation. 
        Format like: "Balanced: [Equation] \n\n Explanation: [Text]"`,
      });

      // Directly access .text property as per guidelines (not .text())
      setResult(response.text || 'Failed to balance equation.');
    } catch (err) {
      setError('An error occurred while balancing the equation. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Zap className="text-yellow-400" />
        Equation Balancer
      </h2>
      
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Enter chemical equation (e.g., H2 + O2 -> H2O)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={equation}
              onChange={(e) => setEquation(e.target.value)}
              placeholder="H2 + O2 -> H2O"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && balanceEquation()}
            />
            <button
              onClick={balanceEquation}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Balance'}
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm bg-red-900/20 p-3 rounded border border-red-900/50">{error}</p>}

        {result && (
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 mt-2">
            <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">Result</p>
            <div className="text-white whitespace-pre-line font-mono">
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquationBalancer;
