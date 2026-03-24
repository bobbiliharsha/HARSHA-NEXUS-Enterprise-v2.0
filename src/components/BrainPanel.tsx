import React from 'react';

interface BrainPanelProps {
  stats: any;
  visible: boolean;
  onClose: () => void;
}

export const BrainPanel: React.FC<BrainPanelProps> = ({ stats, visible, onClose }) => {
  if (!visible) return null;

  return (
    <div className="w-64 bg-[#06090f] border-l border-[#142030] flex flex-col overflow-hidden transition-all duration-200">
      <div className="p-3 border-b border-[#142030] flex items-center justify-between">
        <div className="font-['Syne'] font-bold text-[10px] text-[#06b6d4] tracking-widest">⚡ BRAIN v2.0</div>
        <button onClick={onClose} className="text-[#5a80a0] hover:text-white text-[10px]">✕</button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        <section>
          <div className="text-[8px] text-[#243650] tracking-widest uppercase mb-1">Consciousness φ</div>
          <div className="bg-[#0a1018] border border-[#142030] rounded-md p-2">
            <div className="text-base font-bold text-[#06b6d4] font-['Syne']">{(stats.phi || 0).toFixed(3)}</div>
            <div className="bg-[#0a1018] rounded-sm h-[3px] my-1 overflow-hidden">
              <div 
                className="h-full bg-[#06b6d4] transition-all duration-500" 
                style={{ width: `${(stats.phi || 0) * 100}%` }}
              />
            </div>
            <div className="text-[8px] text-[#5a80a0]">{stats.phi > 0.5 ? 'integrative' : 'minimal'}</div>
          </div>
        </section>

        <section>
          <div className="text-[8px] text-[#243650] tracking-widest uppercase mb-1">Core Stats</div>
          <div className="grid grid-cols-2 gap-1">
            <div className="bg-[#0a1018] border border-[#142030] rounded-md p-2">
              <div className="text-sm font-bold text-[#06b6d4] font-['Syne']">{stats.cycle || 0}</div>
              <div className="text-[7px] text-[#243650]">Cycles</div>
            </div>
            <div className="bg-[#0a1018] border border-[#142030] rounded-md p-2">
              <div className="text-sm font-bold text-[#06b6d4] font-['Syne']">{stats.world_model?.entities || 0}</div>
              <div className="text-[7px] text-[#243650]">Entities</div>
            </div>
          </div>
        </section>

        <section>
          <div className="text-[8px] text-[#243650] tracking-widest uppercase mb-1">v2.0 Systems</div>
          <div className="space-y-1">
            {[
              { name: 'PII Guard', val: stats.pii_redacted ? 'redacted' : 'active' },
              { name: 'Agent Swarm', val: '8 specialists' },
              { name: 'Tool Engine', val: 'active' },
              { name: 'World Model', val: `${stats.world_model?.entities || 0} entities` }
            ].map(s => (
              <div key={s.name} className="bg-[#0a1018] border border-[#142030] rounded-sm p-1.5 text-[8px]">
                <div className="text-[#06b6d4] font-['Syne'] font-semibold">{s.name}</div>
                <div className="text-[#5a80a0]">{s.val}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
