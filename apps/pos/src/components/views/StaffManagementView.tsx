'use client';
import React, { useState, useEffect } from 'react';

interface StaffMember { id: string; name: string; role: string; isActive: boolean; lastActive?: string; }

const ROLES = ['ADMIN', 'MANAGER', 'CASHIER', 'STAFF'];

const AddStaffModal: React.FC<{ onClose: () => void; onAdded: (s: StaffMember) => void }> = ({ onClose, onAdded }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('STAFF');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    if (!password.trim()) { setError('Password is required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role,
          username: username.trim() || name.trim().toLowerCase().replace(/\s+/g, '.'),
          password,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      onAdded(data);
      onClose();
    } catch (e) {
      setError('Failed to create staff member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-8" style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }}>
      <div className="glass-card border border-white/10 noise-bg rounded-xl p-12 w-full max-w-md shadow-2xl">
        <h3 className="text-3xl font-bold uppercase tracking-tight text-theme-primary mb-10">Add Staff Member</h3>
        <form onSubmit={submit} className="space-y-6">
          <div className="group">
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2 group-focus-within:text-emerald-500 transition-colors">Full Name</label>
            <input value={name} onChange={e => { setName(e.target.value); if (!username) {} }}
              className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all"
              placeholder="Enter full name..." required />
          </div>
          <div className="group">
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2 group-focus-within:text-emerald-500 transition-colors">Username <span className="text-zinc-700">(used to log in)</span></label>
            <input value={username} onChange={e => setUsername(e.target.value)}
              className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all"
              placeholder={name ? name.toLowerCase().replace(/\s+/g, '.') : 'e.g. john.doe'} />
            <p className="text-[9px] text-zinc-700 mt-1 ml-1">Leave blank to auto-generate from name</p>
          </div>
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="group">
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2 group-focus-within:text-emerald-500 transition-colors">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all"
              placeholder="Set login password..." required />
          </div>
          {error && <p className="text-rose-500 font-bold text-[10px] uppercase tracking-widest">{error}</p>}
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl border border-white/10 text-zinc-500 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-4 rounded-2xl bg-emerald-500 text-black font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-all disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditStaffModal: React.FC<{ staff: StaffMember; onClose: () => void; onUpdated: (s: StaffMember) => void }> = ({ staff, onClose, onUpdated }) => {
  const [name, setName] = useState(staff.name);
  const [role, setRole] = useState(staff.role);
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: staff.id,
          name,
          role,
          ...(username.trim() && { username: username.trim() }),
          ...(newPassword && { password: newPassword }),
        }),
      });
      const data = await res.json();
      if (!data.error) onUpdated({ ...staff, name, role });
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-8" style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }}>
      <div className="glass-card border border-white/10 noise-bg rounded-xl p-12 w-full max-w-md shadow-2xl">
        <h3 className="text-3xl font-bold uppercase tracking-tight text-theme-primary mb-10">Edit {staff.name}</h3>
        <form onSubmit={submit} className="space-y-6">
          <div className="group">
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2 group-focus-within:text-emerald-500 transition-colors">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all" />
          </div>
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="group">
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2 group-focus-within:text-emerald-500 transition-colors">Change Username <span className="text-zinc-700">(leave blank to keep current)</span></label>
            <input value={username} onChange={e => setUsername(e.target.value)}
              className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all"
              placeholder="New username..." />
          </div>
          <div className="group">
            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2 group-focus-within:text-emerald-500 transition-colors">Reset Password <span className="text-zinc-700">(leave blank to keep current)</span></label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-theme-bg border border-theme-surface rounded-2xl px-6 py-4 text-theme-primary font-bold focus:outline-none focus:border-emerald-500/30 transition-all"
              placeholder="New password..." />
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

export const StaffManagementView: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);

  useEffect(() => {
    fetch('/api/staff')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setStaff(data); })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
    try {
      await fetch('/api/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus })
      });
    } catch (e) {
      setStaff(prev => prev.map(s => s.id === id ? { ...s, isActive: currentStatus } : s));
    }
  };

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar pb-20 p-8">
      {showAddModal && (
        <AddStaffModal
          onClose={() => setShowAddModal(false)}
          onAdded={newMember => setStaff(prev => [newMember, ...prev])}
        />
      )}
      {editTarget && (
        <EditStaffModal
          staff={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={updated => {
            setStaff(prev => prev.map(s => s.id === updated.id ? updated : s));
            setEditTarget(null);
          }}
        />
      )}

      {/* Search & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
        <div className="flex-1 max-w-2xl relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 pointer-events-none group-focus-within:text-emerald-500 transition-colors">🔍</div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="FIND TEAM MEMBER..."
            className="w-full bg-theme-bg border border-theme-surface rounded-2xl pl-14 pr-6 py-5 text-theme-primary font-bold tracking-tight focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 transition-all placeholder:text-zinc-500 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-10 py-5 bg-emerald-500 text-black rounded-2xl font-bold uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(16,185,129,0.2)]"
        >
          + Add Staff Member
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-zinc-900/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((s) => (
            <div key={s.id} className={`glass-card p-5 border border-theme-surface noise-bg rounded-xl transition-all duration-500 relative overflow-hidden group ${s.isActive ? 'hover:border-emerald-500/30' : 'opacity-50 grayscale'}`}>
              <div className="flex items-center gap-3.5 mb-4 relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner shrink-0 ${
                  s.role === 'ADMIN' ? 'bg-rose-500/20 text-rose-500' :
                  s.role === 'MANAGER' ? 'bg-amber-500/20 text-amber-500' :
                  'bg-emerald-500/20 text-emerald-500'
                }`}>
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-base tracking-tight text-theme-primary uppercase truncate group-hover:text-emerald-500 transition-colors">{s.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${s.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-theme-secondary">{s.role} · {s.id.substring(0, 6)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4 relative z-10">
                <div className="flex justify-between items-center py-2 border-b border-theme-surface">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-theme-secondary/70">Last Active</span>
                  <span className="text-xs font-bold text-theme-secondary italic">{s.lastActive || 'Never'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-theme-surface">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-theme-secondary/70">Security Level</span>
                  <span className="text-xs font-bold uppercase text-emerald-500/80">
                    Level {s.role === 'ADMIN' ? '4' : s.role === 'MANAGER' ? '3' : s.role === 'CASHIER' ? '2' : '1'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5 relative z-10">
                <button
                  onClick={() => toggleStatus(s.id, s.isActive)}
                  className={`flex-1 py-2.5 rounded-xl text-[8px] font-bold uppercase tracking-widest transition-all ${
                    s.isActive ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black'
                  }`}
                >
                  {s.isActive ? 'Revoke Access' : 'Restore Access'}
                </button>
                <button
                  onClick={() => setEditTarget(s)}
                  className="w-9 h-9 rounded-xl bg-theme-bg border border-theme-surface flex items-center justify-center text-theme-secondary hover:text-theme-primary hover:border-theme-primary/30 transition-all"
                >
                  ✎
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && !loading && (
            <div className="col-span-full py-40 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-theme-bg border border-theme-surface rounded-full flex items-center justify-center text-4xl mb-6 noise-bg shadow-inner">
                🕵️
              </div>
              <p className="font-bold text-2xl text-theme-primary uppercase tracking-tighter mb-2">Personnel Not Found</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-700 max-w-xs">
                {search ? `No matches for "${search}"` : 'No staff members yet. Add your first team member.'}
              </p>
              {search
                ? <button onClick={() => setSearch('')} className="mt-8 text-[9px] font-bold uppercase tracking-widest text-emerald-500 hover:text-white transition-colors">← Clear Search</button>
                : <button onClick={() => setShowAddModal(true)} className="mt-8 px-8 py-4 bg-emerald-500 text-black rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-all">+ Add First Member</button>
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
};
