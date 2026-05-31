'use client';
import React, { useState, useEffect } from 'react';

interface MenuItem { id: string; name: string; price: number; shortcutKey: string | null; description: string | null; isAvailable?: boolean; }
interface MenuCategory { id: string; name: string; items: MenuItem[]; }

const AddItemModal: React.FC<{
  categories: MenuCategory[];
  onClose: () => void;
  onAdded: (catId: string, item: MenuItem) => void;
}> = ({ categories, onClose, onAdded }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [shortcutKey, setShortcutKey] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !categoryId) { setError('Name, price and category are required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price: parseFloat(price), categoryId, shortcutKey: shortcutKey || null, description: description || null }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      onAdded(categoryId, data);
      onClose();
    } catch {
      setError('Failed to create item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-8" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}>
      <div className="glass-card border border-theme-surface noise-bg rounded-xl p-12 w-full max-w-md shadow-2xl">
        <h3 className="text-3xl font-bold uppercase tracking-tight text-theme-primary mb-10">New Menu Item</h3>
        <form onSubmit={submit} className="space-y-6">
          <div className="group">
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2 group-focus-within:text-emerald-500 transition-colors">Item Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all"
              placeholder="Enter item name..." required />
          </div>
          <div className="group">
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2 group-focus-within:text-emerald-500 transition-colors">Price (₹)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)}
              className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all"
              placeholder="0.00" required min="0" step="0.01" />
          </div>
          <div className="group">
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2 group-focus-within:text-emerald-500 transition-colors">Shortcut Key (e.g. B1)</label>
            <input value={shortcutKey} onChange={e => setShortcutKey(e.target.value.toUpperCase())}
              className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all"
              placeholder="e.g. B1" maxLength={4} />
          </div>
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Category</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all">
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="group">
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2 group-focus-within:text-emerald-500 transition-colors">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all"
              placeholder="Item description..." rows={3} />
          </div>
          {error && <p className="text-rose-500 font-bold text-[10px] uppercase tracking-widest">{error}</p>}
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl border border-white/10 text-zinc-500 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-4 rounded-2xl bg-emerald-500 text-black font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-all disabled:opacity-50">
              {saving ? 'Creating...' : 'Add to Menu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditItemModal: React.FC<{
  item: MenuItem;
  categories: MenuCategory[];
  currentCatId: string;
  onClose: () => void;
  onUpdated: (catId: string, item: MenuItem) => void;
}> = ({ item, categories, currentCatId, onClose, onUpdated }) => {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(String(item.price));
  const [categoryId, setCategoryId] = useState(currentCatId);
  const [shortcutKey, setShortcutKey] = useState(item.shortcutKey || '');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`/api/menu/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price: parseFloat(price), shortcutKey: shortcutKey || null }),
      });
      onUpdated(categoryId, { ...item, name, price: parseFloat(price), shortcutKey: shortcutKey || null });
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-8" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}>
      <div className="glass-card border border-theme-surface noise-bg rounded-xl p-12 w-full max-w-lg shadow-2xl">
        <h3 className="text-3xl font-bold uppercase tracking-tight text-theme-primary mb-10">Edit Item</h3>
        <form onSubmit={submit} className="space-y-5">
          <div className="group">
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2 group-focus-within:text-emerald-500 transition-colors">Item Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="group">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2 group-focus-within:text-emerald-500 transition-colors">Price (₹)</label>
              <input type="number" min="0" step="0.50" value={price} onChange={e => setPrice(e.target.value)}
                className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all" />
            </div>
            <div className="group">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2 group-focus-within:text-emerald-500 transition-colors">Shortcut</label>
              <input value={shortcutKey} onChange={e => setShortcutKey(e.target.value.toUpperCase())}
                className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all"
                maxLength={4} />
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl border border-white/10 text-zinc-500 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-4 rounded-2xl bg-white text-black font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-all disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const MenuEditorView: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<{ item: MenuItem; catId: string } | null>(null);

  useEffect(() => {
    fetch('/api/menu?all=true')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCategories(data); })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const toggleAvailability = async (catId: string, itemId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setCategories(prev => prev.map(c =>
      c.id === catId ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, isAvailable: newStatus } : i) } : c
    ));
    try {
      await fetch(`/api/menu/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: newStatus })
      });
    } catch {
      setCategories(prev => prev.map(c =>
        c.id === catId ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, isAvailable: currentStatus } : i) } : c
      ));
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Loading Menu...</p>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar pb-20 p-8">
      {showAddModal && (
        <AddItemModal
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onAdded={(catId, item) => {
            setCategories(prev => prev.map(c =>
              c.id === catId ? { ...c, items: [...c.items, item] } : c
            ));
          }}
        />
      )}
      {editTarget && (
        <EditItemModal
          item={editTarget.item}
          categories={categories}
          currentCatId={editTarget.catId}
          onClose={() => setEditTarget(null)}
          onUpdated={(catId, updated) => {
            setCategories(prev => prev.map(c =>
              c.id === catId ? { ...c, items: c.items.map(i => i.id === updated.id ? updated : i) } : c
            ));
          }}
        />
      )}

      {/* Search & Actions */}
      <div className="flex gap-4 mb-10">
        <div className="flex-1 max-w-2xl relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 pointer-events-none group-focus-within:text-emerald-500 transition-colors">🔍</div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="SEARCH MENU ITEMS..."
            className="w-full bg-theme-bg border border-theme-surface rounded-2xl pl-14 pr-6 py-5 text-theme-primary font-bold tracking-tight focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 transition-all placeholder:text-zinc-500 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-10 py-5 bg-emerald-500 text-black rounded-2xl font-bold uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(16,185,129,0.2)]"
        >
          + New Item
        </button>
      </div>

      <div className="space-y-12">
        {categories.map(cat => {
          const filteredItems = cat.items.filter(
            i =>
              i.name.toLowerCase().includes(search.toLowerCase()) ||
              (i.shortcutKey && String(i.shortcutKey).trim().toLowerCase().includes(search.trim().toLowerCase()))
          );
          if (filteredItems.length === 0 && search) return null;

          return (
            <div key={cat.id} className="relative">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-3xl font-bold tracking-tighter uppercase text-theme-primary">{cat.name}</h3>
                <div className="h-0.5 flex-1 bg-gradient-to-r from-theme-surface to-transparent" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">{cat.items.length} SKUs</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredItems.map((item) => {
                  const isAvailable = item.isAvailable !== false;
                  return (
                    <div key={item.id} className={`glass-card p-4 border border-theme-surface noise-bg rounded-xl transition-all duration-500 relative overflow-hidden group ${isAvailable ? 'hover:border-emerald-500/30' : 'opacity-60 grayscale'}`}>
                      <div className={`absolute top-0 right-0 w-16 h-16 blur-[20px] opacity-10 transition-colors ${isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`} />

                      <div className="flex justify-between items-start mb-2 relative z-10">
                        <div className="min-w-0 flex-1 pr-2">
                          <span className="font-semibold text-sm tracking-tight text-theme-primary block truncate mb-0.5 group-hover:text-emerald-500 transition-colors" title={item.name}>{item.name}</span>
                          <span className="text-[8px] font-bold text-theme-secondary uppercase tracking-widest">ID: {item.id.substring(0, 6)}</span>
                        </div>
                        {/* Availability toggle */}
                        <button
                          onClick={() => toggleAvailability(cat.id, item.id, isAvailable)}
                          className={`w-9 h-5 rounded-full relative transition-all duration-300 p-0.5 shrink-0 ${isAvailable ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                        >
                          <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-lg transition-transform duration-300 ${isAvailable ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4 relative z-10">
                        <span className="text-base font-extrabold text-emerald-500 tracking-tighter">₹{item.price.toFixed(2)}</span>
                        <div className="flex items-center gap-1.5">
                          {item.shortcutKey && (
                            <span className="px-1.5 py-0.5 rounded bg-theme-bg border border-theme-surface text-[8px] font-bold text-theme-secondary uppercase tracking-widest">{item.shortcutKey}</span>
                          )}
                          {/* Working edit button */}
                          <button
                            onClick={() => setEditTarget({ item, catId: cat.id })}
                            className="w-7 h-7 rounded-full bg-theme-surface/5 border border-theme-surface flex items-center justify-center text-[10px] text-theme-secondary hover:text-theme-primary hover:border-theme-primary/30 transition-colors"
                          >
                            ✎
                          </button>
                        </div>
                      </div>

                      {!isAvailable && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                          <span className="px-3 py-1 bg-rose-500 text-white font-bold text-[8px] uppercase tracking-[0.2em] rounded-full shadow-2xl rotate-[-3deg]">OUT_OF_STOCK</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {categories.length === 0 && (
          <div className="py-40 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-theme-bg border border-theme-surface rounded-full flex items-center justify-center text-4xl mb-6">🍽️</div>
            <p className="font-bold text-2xl text-theme-primary uppercase tracking-tighter mb-2">Menu is Empty</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-700 max-w-xs">No categories or items found. Add your first menu item to get started.</p>
            <button onClick={() => setShowAddModal(true)} className="mt-8 px-8 py-4 bg-emerald-500 text-black rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-all">+ Add First Item</button>
          </div>
        )}
      </div>
    </div>
  );
};
