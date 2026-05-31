import React from 'react';

interface ModifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  onApply: (modifiers: string[]) => void;
}

const commonModifiers = [
  'No Onion', 'Extra Spicy', 'Less Oil', 'No Salt',
  'Extra Cheese', 'Jain Style', 'Gluten Free', 'Vegan'
];

export const ModifierModal: React.FC<ModifierModalProps> = ({ isOpen, onClose, itemName, onApply }) => {
  const [selected, setSelected] = React.useState<string[]>([]);

  if (!isOpen) return null;

  const toggleModifier = (mod: string) => {
    setSelected(prev => 
      prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-white/10 rounded-xl w-full max-w-xl p-10 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-sm font-bold text-emerald-500 uppercase tracking-[0.3em] mb-2">Customize Item</h2>
            <h3 className="text-4xl font-bold tracking-tight uppercase text-white">{itemName}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          {commonModifiers.map((mod) => (
            <button
              key={mod}
              onClick={() => toggleModifier(mod)}
              className={`
                px-6 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all
                ${selected.includes(mod) 
                  ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                  : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 border border-white/5'}
              `}
            >
              {mod}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs text-zinc-500 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={() => onApply(selected)}
            className="flex-[2] py-5 bg-white text-black rounded-2xl font-bold uppercase tracking-[0.2em] text-xs hover:scale-105 transition-all shadow-xl"
          >
            Apply Modifiers
          </button>
        </div>
      </div>
    </div>
  );
};
