import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain as BrainIcon, 
  Cpu, 
  Atom, 
  Microscope, 
  Globe, 
  Dna, 
  Code, 
  Lightbulb,
  Send,
  Paperclip,
  Mic,
  RotateCcw,
  Zap,
  ChevronRight,
  Info
} from 'lucide-react';
import { ALL_DOMAINS, DomainInfo } from './types';
import { Brain } from './services/brainService';
import { BrainPanel } from './components/BrainPanel';

const brain = new Brain();

export default function App() {
  const [currentDomain, setCurrentDomain] = useState<string>('general');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [brainVisible, setBrainVisible] = useState(true);
  const [swarmEnabled, setSwarmEnabled] = useState(false);
  const [stats, setStats] = useState<any>({ cycle: 0, phi: 0, world_model: { entities: 0 } });
  const [pingData, setPingData] = useState<any>(null);

  const msgsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/ping')
      .then(res => res.json())
      .then(data => setPingData(data));
  }, []);

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg = { role: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const result = await brain.think(inputText, currentDomain);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: result.response,
        domain: currentDomain,
        data: result
      }]);
      setStats(result);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Error: Failed to process intelligence.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const domain = ALL_DOMAINS[currentDomain];

  return (
    <div className="flex h-screen bg-[#030508] text-[#c0d8f0] font-mono selection:bg-[#6366f1]/30">
      {/* Sidebar */}
      <div className="w-[218px] bg-[#06090f] border-r border-[#142030] flex flex-col">
        <div className="p-4 border-b border-[#142030]">
          <div className="font-['Syne'] text-sm font-extrabold text-white">
            HARSHA<span className="text-[#06b6d4]">·NEXUS</span>
          </div>
          <div className="text-[8px] text-[#5a80a0] tracking-widest mt-0.5 uppercase">Enterprise v2.0 — 10/10</div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {Object.entries(ALL_DOMAINS).map(([id, d]) => (
            <button
              key={id}
              onClick={() => setCurrentDomain(id)}
              className={`w-full flex items-center gap-2 p-2 rounded-md transition-all text-left ${
                currentDomain === id ? 'bg-[#0e1520] text-white border-l-2' : 'text-[#5a80a0] hover:bg-[#0a1018] hover:text-[#c0d8f0]'
              }`}
              style={{ borderLeftColor: currentDomain === id ? d.color : 'transparent' }}
            >
              <span className="text-sm">{d.icon}</span>
              <div>
                <div className="font-['Syne'] font-semibold text-[10px]">{d.label}</div>
                <div className="text-[8px] text-[#243650] truncate w-32">{d.tagline}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-3 border-top border-[#142030] text-[8px] space-y-1">
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${pingData ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[#5a80a0]">{pingData?.client || 'Connecting...'}</span>
          </div>
          <div className="text-[#243650]">LLM: {pingData?.llm_backend || '...'}</div>
          <div className="flex flex-wrap gap-0.5 mt-1">
            {['PII', 'SWARM', 'TOOLS', 'WORLD'].map(s => (
              <span key={s} className="px-1 border border-green-500/30 text-green-500 bg-green-500/5 rounded-[1px]">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="h-[46px] bg-[#06090f] border-b border-[#142030] flex items-center px-4 gap-3">
          <div className="flex-1 flex items-center gap-2">
            <span className="text-lg">{domain.icon}</span>
            <span className="font-['Syne'] font-bold text-sm text-white">{domain.label}</span>
            <span className="text-[8px] text-[#5a80a0]">— {domain.tagline}</span>
          </div>
          
          <button 
            onClick={() => setSwarmEnabled(!swarmEnabled)}
            className={`px-2 py-1 rounded border text-[8px] transition-all ${
              swarmEnabled ? 'bg-[#0e1520] border-[#06b6d4] text-[#06b6d4]' : 'border-[#1c2e44] text-[#5a80a0] hover:bg-[#0a1018]'
            }`}
          >
            <Zap size={10} className="inline mr-1" /> Swarm
          </button>
          
          <button 
            onClick={() => setMessages([])}
            className="px-2 py-1 rounded border border-[#1c2e44] text-[#5a80a0] hover:bg-[#0a1018] text-[8px]"
          >
            <RotateCcw size={10} />
          </button>

          <button 
            onClick={() => setBrainVisible(!brainVisible)}
            className={`px-2 py-1 rounded border text-[8px] transition-all ${
              brainVisible ? 'bg-[#0e1520] border-[#6366f1] text-[#6366f1]' : 'border-[#1c2e44] text-[#5a80a0] hover:bg-[#0a1018]'
            }`}
          >
            ◧
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#1c2e44]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-10">
              <div className="font-['Syne'] text-3xl font-extrabold text-white mb-2">
                Harsha <span className="italic text-[#06b6d4]">Nexus v2.0</span>
              </div>
              <p className="text-[11px] text-[#5a80a0] max-w-lg leading-relaxed mb-6">
                Private Intelligence Platform. 19 cognitive layers, PII guard, agent swarm, and autonomous tool engine. Fully sovereign.
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-xl">
                {Object.entries(ALL_DOMAINS).slice(0, 8).map(([id, d]) => (
                  <button
                    key={id}
                    onClick={() => setCurrentDomain(id)}
                    className="bg-[#0a1018] border border-[#142030] rounded-lg p-3 hover:border-[#6366f1] hover:bg-[#0e1520] transition-all group"
                  >
                    <div className="text-xl mb-1">{d.icon}</div>
                    <div className="font-['Syne'] text-[8px] font-bold uppercase tracking-wider">{d.label}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i}
                className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 border ${
                  m.role === 'user' ? 'bg-[#6366f1] border-[#6366f1] text-white font-bold' : 'bg-[#0a1018] border-[#1c2e44]'
                }`}>
                  {m.role === 'user' ? 'U' : (ALL_DOMAINS[m.domain || 'general']?.icon || '🧠')}
                </div>
                
                <div className={`max-w-[80%] ${m.role === 'user' ? 'items-end' : ''} flex flex-col`}>
                  {m.role === 'ai' && m.domain && (
                    <div className="text-[7px] text-[#243650] uppercase tracking-widest mb-1 font-['Syne'] font-bold">
                      {ALL_DOMAINS[m.domain].icon} {ALL_DOMAINS[m.domain].label}
                    </div>
                  )}
                  <div className={`p-3 rounded-xl text-xs leading-relaxed border ${
                    m.role === 'user' ? 'bg-[#0e1520] border-[#1c2e44]' : 'bg-[#0a1018] border-[#142030]'
                  }`}>
                    {m.text}
                    
                    {m.data && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="px-1.5 py-0.5 bg-[#6366f1]/10 text-[#a5b4fc] border border-[#6366f1]/20 rounded text-[8px]">
                          φ={(m.data.phi || 0).toFixed(3)}
                        </span>
                        {m.data.pii_redacted && (
                          <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[8px]">
                            PII Redacted
                          </span>
                        )}
                        {m.data.tool_calls?.length > 0 && (
                          <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded text-[8px]">
                            🔧 {m.data.tool_calls.length} Tools
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
          
          {isTyping && (
            <div className="flex gap-3 pl-10">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1 h-1 bg-[#06b6d4] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-1 h-1 bg-[#06b6d4] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-1 h-1 bg-[#06b6d4] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={msgsEndRef} />
        </div>

        <div className="p-4 border-t border-[#142030] bg-[#06090f]">
          <div className="flex gap-2 items-end">
            <button className="w-9 h-9 rounded-lg border border-[#1c2e44] bg-[#0a1018] text-[#5a80a0] hover:text-white flex items-center justify-center transition-all">
              <Paperclip size={16} />
            </button>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="All data stays on this server. PII auto-redacted..."
              className="flex-1 bg-[#0a1018] border border-[#1c2e44] rounded-lg p-2.5 text-xs text-[#c0d8f0] outline-none focus:border-[#06b6d4] transition-all resize-none min-h-[38px] max-h-32"
              rows={1}
            />
            <button className="w-9 h-9 rounded-lg border border-[#1c2e44] bg-[#0a1018] text-[#5a80a0] hover:text-white flex items-center justify-center transition-all">
              <Mic size={16} />
            </button>
            <button 
              onClick={handleSend}
              disabled={!inputText.trim() || isTyping}
              className="w-9 h-9 rounded-lg bg-[#6366f1] text-white flex items-center justify-center hover:brightness-110 disabled:opacity-40 transition-all"
            >
              <Send size={16} />
            </button>
          </div>
          
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              'Explain quantum entanglement',
              'Analyze carbon nanotubes',
              'N-body gravity simulation',
              'Consciousness level'
            ].map(h => (
              <button 
                key={h}
                onClick={() => setInputText(h)}
                className="whitespace-nowrap text-[8px] text-[#243650] bg-[#0a1018] px-2 py-1 rounded-full border border-[#142030] hover:text-[#c0d8f0] hover:border-[#1c2e44] transition-all"
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Brain Panel */}
      <BrainPanel 
        stats={stats} 
        visible={brainVisible} 
        onClose={() => setBrainVisible(false)} 
      />
    </div>
  );
}
