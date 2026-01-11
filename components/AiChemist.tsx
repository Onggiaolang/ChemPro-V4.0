
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';

const AiChemist: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      // Initialize GoogleGenAI with named parameter
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        // Use gemini-3-pro-preview for complex STEM tasks
        model: 'gemini-3-pro-preview',
        contents: currentInput,
        config: {
          systemInstruction: 'You are an expert chemist assistant called ChemMaster AI. You help students and researchers with stoichiometry, organic chemistry, thermodynamics, and laboratory procedures. Provide clear, step-by-step explanations.',
          // Enable Google Search grounding
          tools: [{ googleSearch: {} }]
        },
      });

      // Extract grounding chunks from the response as required by guidelines
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => chunk.web)
        .filter((web: any) => web && web.uri);

      const modelMessage: ChatMessage = {
        role: 'model',
        // Access .text property directly
        text: response.text || "I'm sorry, I couldn't process that request.",
        timestamp: Date.now(),
        sources: sources,
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, {
        role: 'model',
        text: 'An error occurred. Please check your connection and try again.',
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col h-[600px] overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Bot className="text-white" size={24} />
          </div>
          <div>
            <h2 className="font-bold text-lg">AI Chemist Assistant</h2>
            <p className="text-xs text-blue-400 flex items-center gap-1">
              <Sparkles size={12} /> Online & Ready
            </p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/30">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-10">
            <Bot size={48} className="mb-4 text-blue-500" />
            <p className="text-lg font-medium">Welcome to the Virtual Lab</p>
            <p className="text-sm">Ask me about chemical reactions, molar mass, or laboratory safety.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-blue-600' : 'bg-slate-700'}`}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-700 text-slate-100 rounded-tl-none'}`}>
                <div className="whitespace-pre-wrap">{m.text}</div>
                {/* Always list URLs when search grounding is used as per guidelines */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-600">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Sources:</p>
                    <div className="flex flex-wrap gap-2">
                      {m.sources.map((source, idx) => (
                        <a 
                          key={idx} 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-400 hover:text-blue-300 bg-slate-800 px-2 py-1 rounded border border-slate-600 transition-colors"
                        >
                          {source.title || 'Source'}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center text-slate-400">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                <Loader2 className="animate-spin" size={16} />
              </div>
              <span className="text-xs italic">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your chemistry question..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-2 rounded-xl transition-all"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChemist;
