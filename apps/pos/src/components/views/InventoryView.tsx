'use client';
import React, { useState, useEffect } from 'react';

interface StockItem { id: string; name: string; category: string; stockLevel: number; unit: string; minQty: number; costPerUnit: number; isLowStock: boolean; }

// ─── Add Ingredient Modal ────────────────────────────────────────────────────
const AddIngredientModal: React.FC<{
  onClose: () => void;
  onAdded: (item: StockItem) => void;
}> = ({ onClose, onAdded }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [unit, setUnit] = useState('kg');
  const [stockLevel, setStockLevel] = useState('0');
  const [minQty, setMinQty] = useState('10');
  const [costPerUnit, setCostPerUnit] = useState('0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !unit.trim()) { setError('Name and unit are required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category: category.trim() || 'General',
          unit: unit.trim(),
          stockLevel: parseFloat(stockLevel) || 0,
          minQty: parseFloat(minQty) || 10,
          costPerUnit: parseFloat(costPerUnit) || 0,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      onAdded(data);
      onClose();
    } catch {
      setError('Failed to add ingredient. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-8" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}>
      <div className="glass-card border border-theme-surface noise-bg rounded-xl p-12 w-full max-w-lg shadow-2xl">
        <h3 className="text-3xl font-bold uppercase tracking-tight text-theme-primary mb-10">Add Ingredient</h3>
        <form onSubmit={submit} className="space-y-5">
          {/* Row 1: Name */}
          <div className="group">
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2 group-focus-within:text-emerald-500 transition-colors">Ingredient Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all"
              placeholder="e.g. Chicken Breast" required />
          </div>

          {/* Row 2: Category + Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="group">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2 group-focus-within:text-emerald-500 transition-colors">Category</label>
              <input value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all"
                placeholder="e.g. Meat" />
            </div>
            <div className="group">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2 group-focus-within:text-emerald-500 transition-colors">Unit</label>
              <select value={unit} onChange={e => setUnit(e.target.value)}
                className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all">
                {['kg', 'g', 'L', 'ml', 'pcs', 'cans', 'unit', 'dozen', 'pack'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Stock Level + Min Qty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="group">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2 group-focus-within:text-emerald-500 transition-colors">Current Stock</label>
              <input type="number" min="0" step="0.1" value={stockLevel} onChange={e => setStockLevel(e.target.value)}
                className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all" />
            </div>
            <div className="group">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2 group-focus-within:text-emerald-500 transition-colors">Min Qty (Alert Below)</label>
              <input type="number" min="0" step="0.1" value={minQty} onChange={e => setMinQty(e.target.value)}
                className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all" />
            </div>
          </div>

          {/* Row 4: Cost per Unit */}
          <div className="group">
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2 group-focus-within:text-emerald-500 transition-colors">Cost per Unit (₹)</label>
            <input type="number" min="0" step="0.01" value={costPerUnit} onChange={e => setCostPerUnit(e.target.value)}
              className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all"
              placeholder="0.00" />
          </div>

          {error && <p className="text-rose-500 font-bold text-[10px] uppercase tracking-widest">{error}</p>}

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 py-4 rounded-2xl border border-white/10 text-zinc-500 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-4 rounded-2xl bg-emerald-500 text-black font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-all disabled:opacity-50">
              {saving ? 'Adding...' : 'Add Ingredient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main View ───────────────────────────────────────────────────────────────
export const InventoryView: React.FC = () => {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  // Inline stock edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetch('/api/inventory')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setStock(data); })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const saveStockEdit = async (id: string) => {
    const newLevel = parseFloat(editValue);
    if (isNaN(newLevel)) { setEditingId(null); return; }
    // Optimistic update
    setStock(prev => prev.map(i => i.id === id ? { ...i, stockLevel: newLevel, isLowStock: newLevel < i.minQty } : i));
    setEditingId(null);
    try {
      await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, stockLevel: newLevel }),
      });
    } catch {
      // Silently revert on error — re-fetch to sync
      fetch('/api/inventory').then(r => r.json()).then(data => { if (Array.isArray(data)) setStock(data); });
    }
  };

  const filtered = stock.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()));
  const lowStock = stock.filter(i => i.isLowStock);

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Loading Inventory...</p>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar pb-20 p-8">
      {showAddModal && (
        <AddIngredientModal
          onClose={() => setShowAddModal(false)}
          onAdded={newItem => setStock(prev => [newItem, ...prev])}
        />
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass-card p-8 border border-white/5 noise-bg rounded-xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Total Ingredients</p>
          <p className="text-4xl font-bold tracking-tighter text-theme-primary">{stock.length}</p>
        </div>
        <div className="glass-card p-8 border border-white/5 noise-bg rounded-xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Low Stock items</p>
          <p className="text-4xl font-bold tracking-tighter text-rose-500">{lowStock.length}</p>
        </div>
        <div className="glass-card p-8 border border-white/5 noise-bg rounded-xl bg-emerald-500/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Inventory Value</p>
          <p className="text-4xl font-bold tracking-tighter text-emerald-500">₹{stock.reduce((a,b) => a + (b.stockLevel * b.costPerUnit), 0).toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
        <div className="flex-1 max-w-2xl relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 pointer-events-none group-focus-within:text-emerald-500 transition-colors">🔍</div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="AUDIT INVENTORY..."
            className="w-full bg-theme-bg border border-theme-surface rounded-2xl pl-14 pr-6 py-5 text-theme-primary font-bold tracking-tight focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 transition-all placeholder:text-zinc-500 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-10 py-5 bg-white text-black rounded-2xl font-bold uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl"
        >
          + Add Ingredient
        </button>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[2.5fr_1.5fr_2fr_1.2fr_1.2fr] px-8 py-4 bg-theme-surface/30 border border-theme-surface rounded-2xl mb-4 text-[9px] font-bold uppercase tracking-widest text-theme-secondary">
        <span>Item Name / ID</span>
        <span>Category</span>
        <span>Current Level <span className="opacity-50 normal-case">(click to edit)</span></span>
        <span>Min Qty</span>
        <span>Unit Cost</span>
      </div>

      <div className="space-y-3">
        {filtered.map((item) => (
          <div key={item.id} className="grid grid-cols-[2.5fr_1.5fr_2fr_1.2fr_1.2fr] items-center px-8 py-6 glass-card border border-theme-surface noise-bg rounded-2xl group hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-lg italic tracking-tight text-theme-primary group-hover:text-emerald-500 transition-colors truncate">{item.name}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-theme-secondary mt-1">{item.id.substring(0,8)}</span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-theme-secondary truncate pr-4">{item.category}</span>

            {/* Inline-editable stock level */}
            <div className="flex flex-col gap-2 pr-10">
              <div className="flex justify-between items-end">
                {editingId === item.id ? (
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    autoFocus
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={() => saveStockEdit(item.id)}
                    onKeyDown={e => { if (e.key === 'Enter') saveStockEdit(item.id); if (e.key === 'Escape') setEditingId(null); }}
                    className="w-24 bg-black/30 border border-emerald-500/50 rounded-lg px-2 py-1 text-sm font-bold text-emerald-400 focus:outline-none"
                  />
                ) : (
                  <span
                    onClick={() => { setEditingId(item.id); setEditValue(String(item.stockLevel)); }}
                    className={`text-sm font-bold cursor-pointer hover:underline decoration-dotted ${item.isLowStock ? 'text-rose-500' : 'text-emerald-500'}`}
                    title="Click to edit stock level"
                  >
                    {item.stockLevel} <span className="text-[10px] not-italic text-theme-secondary ml-1">{item.unit}</span>
                  </span>
                )}
                <span className="text-[8px] font-bold text-theme-secondary uppercase">{(item.stockLevel / (item.minQty * 3) * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1 w-full bg-theme-bg rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${item.isLowStock ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, (item.stockLevel / (item.minQty * 3) * 100))}%` }}
                />
              </div>
            </div>

            <span className="text-sm font-bold text-theme-secondary">{item.minQty} <span className="text-[10px] font-bold text-theme-secondary">{item.unit}</span></span>
            <span className="font-bold text-lg italic text-theme-primary">₹{item.costPerUnit.toFixed(2)}</span>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-40 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-zinc-950/50 border border-white/5 rounded-full flex items-center justify-center text-4xl mb-6 noise-bg shadow-inner">📦</div>
            <p className="font-bold text-2xl text-theme-primary uppercase tracking-tighter mb-2">
              {search ? 'No Results' : 'Inventory Empty'}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-700 max-w-xs">
              {search ? `No matching ingredients for "${search}"` : 'Add your first ingredient to get started.'}
            </p>
            {search
              ? <button onClick={() => setSearch('')} className="mt-8 text-[9px] font-bold uppercase tracking-widest text-emerald-500 hover:text-white transition-colors">← Reset Filter</button>
              : <button onClick={() => setShowAddModal(true)} className="mt-8 px-8 py-4 bg-emerald-500 text-black rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-all">+ Add First Ingredient</button>
            }
          </div>
        )}
      </div>
    </div>
  );
};
