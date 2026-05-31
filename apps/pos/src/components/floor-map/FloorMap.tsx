'use client';

import React, { useRef, useEffect, useState } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor, DragEndEvent } from '@dnd-kit/core';
import { restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { DraggableTable } from './DraggableTable';
import { OrderSidePanel } from '../orders/OrderSidePanel';
import { ThemeToggle } from '../common/ThemeToggle';
import { POSSidebar } from '../common/POSSidebar';
import { LiveClock } from '../common/LiveClock';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { InventoryView } from '../views/InventoryView';
import { SalesDashboard } from '../views/SalesDashboard';
import { SettingsView } from '../views/SettingsView';
import { MenuEditorView } from '../views/MenuEditorView';
import { StaffManagementView } from '../views/StaffManagementView';
import { ManagementView } from '../management/ManagementView';
import { usePOSStore, useOrderTotal } from '../../store/posStore';
import { Walkthrough } from '../common/Walkthrough';

const LEGEND = [
  { label: 'Vacant',      color: '#10b981' },
  { label: 'Occupied',    color: '#f59e0b' },
  { label: 'Billed',      color: '#f43f5e' },
  { label: 'Pmt Pending', color: '#a855f7' },
];

// Shows live total on occupied tables
const TableTotal: React.FC<{ tableId: string }> = ({ tableId }) => {
  const total = useOrderTotal(tableId);
  return total > 0 ? <span className="text-[10px] font-bold">₹{total}</span> : null;
};

export const FloorMap: React.FC = () => {
  const {
    tables, sections, sectionConfig,
    isEditMode, activeTab, selectedTableId, isPanelOpen,
    isInitialized, fetchInitialData,
    setSelectedTable, setIsPanelOpen, setIsEditMode, setActiveTab,
    moveTable, addTable, setSectionHeight, activeUser
  } = usePOSStore();

  const addMenuRef = useRef<HTMLDivElement>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [liveRevenue, setLiveRevenue] = useState<number | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [trialDays, setTrialDays] = useState<number | null>(null);
  const [isTrial, setIsTrial] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  const [addingTableSection, setAddingTableSection] = useState<string | null>(null);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);

  const [showMobileConnect, setShowMobileConnect] = useState(false);
  const [hostIp, setHostIp] = useState('192.168.1.XX');

  // License & Trial details modal state
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState<any>(null);
  const [activationKey, setActivationKey] = useState('');
  const [activationError, setActivationError] = useState('');
  const [activating, setActivating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyHardwareId = () => {
    if (!licenseInfo?.hardwareId) return;
    navigator.clipboard.writeText(licenseInfo.hardwareId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActivate = async () => {
    setActivationError('');
    setActivating(true);
    try {
      const res = await fetch('/api/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: activationKey.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (data.success && data.status === 'ACTIVE') {
        setIsTrial(false);
        setTrialDays(0);
        setLicenseInfo(data);
        setShowLicenseModal(false);
        alert('🎉 RestroOS successfully activated! Thank you.');
      } else {
        setActivationError(data.error || 'Invalid activation key for this machine');
      }
    } catch (e) {
      setActivationError('Connection error. Please try again.');
    } finally {
      setActivating(false);
    }
  };

  useEffect(() => {
    fetch('/api/settings/ip')
      .then(res => res.json())
      .then(data => {
        if (data.ip && data.ip !== '127.0.0.1') {
          setHostIp(data.ip);
        } else if (typeof window !== 'undefined') {
          const hostname = window.location.hostname;
          if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
            setHostIp(hostname);
          }
        }
      })
      .catch(() => {
        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname;
          if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
            setHostIp(hostname);
          }
        }
      });
  }, []);

  useEffect(() => {
    setIsElectron(typeof window !== 'undefined' && !!(window as any).electron);
  }, []);

  useEffect(() => {
    if (!isInitialized) fetchInitialData();
  }, [isInitialized, fetchInitialData]);

  // Load trial / license status
  const fetchLicenseInfo = async () => {
    try {
      const res = await fetch('/api/license');
      const data = await res.json();
      setLicenseInfo(data);
      if (data.status === 'TRIAL') {
        setIsTrial(true);
        setTrialDays(data.daysRemaining);
      } else {
        setIsTrial(false);
        setTrialDays(0);
      }
    } catch (e) {
      console.error('Failed to load license details', e);
    }
  };

  useEffect(() => {
    fetchLicenseInfo();
  }, []);

  // Show walkthrough on first boot
  useEffect(() => {
    const completed = localStorage.getItem('rsk_walkthrough_completed');
    if (completed !== 'true') {
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Load live revenue from API
  useEffect(() => {
    const loadRevenue = () => {
      fetch('/api/reports/sales')
        .then(r => r.json())
        .then(data => { if (!data.error) setLiveRevenue(data.revenue); })
        .catch(() => {});
    };
    loadRevenue();
    const interval = setInterval(loadRevenue, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Handle navigate events from child views (e.g. ManagementView -> Inventory)
  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent).detail;
      if (tab) setActiveTab(tab as any);
    };
    window.addEventListener('navigate', handler);
    return () => window.removeEventListener('navigate', handler);
  }, [setActiveTab]);

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 }, // Prevents accidental drags on tap
  }));

  // Close add-table menu on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) setShowAddMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleDragEnd = ({ active, delta }: DragEndEvent) => {
    if (!active) return;
    const table = tables.find(t => t.id === active.id);
    if (table) {
      const snapGrid = 20;
      const targetX = table.position.x + delta.x;
      const targetY = table.position.y + delta.y;
      const snappedX = Math.max(0, Math.round(targetX / snapGrid) * snapGrid);
      const snappedY = Math.max(0, Math.round(targetY / snapGrid) * snapGrid);
      moveTable(String(active.id), { x: snappedX, y: snappedY });
    }
  };

  const handleTableClick = (id: string) => {
    if (isEditMode) return;
    setSelectedTable(id);
  };

  const TAB_VIEWS: Record<string, React.ReactNode> = {
    inventory: <ErrorBoundary label="Inventory"><InventoryView /></ErrorBoundary>,
    sales:     <ErrorBoundary label="Management"><ManagementView /></ErrorBoundary>,
    menu:      <ErrorBoundary label="Menu Editor"><MenuEditorView /></ErrorBoundary>,
    staff:     <ErrorBoundary label="Control Center"><StaffManagementView /></ErrorBoundary>,
    settings:  <ErrorBoundary label="Settings"><SettingsView /></ErrorBoundary>,
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-theme-bg text-theme-primary">
      {/* ── Main Layout Flow ── */}
      <div className="flex h-full w-full overflow-hidden">
        <POSSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/*
         * ── Main content area ─────────────────────────────────────────────────
         * flex:1 + minWidth:0 → takes ALL remaining horizontal space.
         * overflow:hidden (NOT overflow-y:auto!) — this is the critical fix.
         * Having overflow-y:auto on a flex item creates a height cycle in
         * Chromium's layout engine that collapses child w-full to ~60%.
         * Only the inner content div scrolls; main itself clips.
         */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          {/* ── Header (not sticky — main has overflow:hidden so doesn't scroll) ── */}
          <div
            style={{
              borderBottom: '1px solid var(--surface-border)',
              backgroundColor: 'rgba(0,0,0,0.2)',
              flexShrink: 0,
            }}
            className="flex w-full justify-between items-center px-12 py-6 z-[60] backdrop-blur-3xl noise-bg transition-theme"
          >
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter uppercase leading-none text-theme-primary">
                {activeTab === 'floor' ? 'TERMINAL'
                 : activeTab === 'inventory' ? 'INVENTORY'
                 : activeTab === 'sales' ? 'ANALYTICS'
                 : activeTab === 'menu' ? 'RECIPES'
                 : activeTab === 'staff' ? 'CONTROL'
                 : 'CONFIG'}
              </h1>
              {activeTab === 'floor' && (
                <div className="flex items-center gap-4 mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex gap-4">
                    {LEGEND.map(l => (
                      <div key={l.label} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: l.color, color: l.color }} />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-theme-secondary">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-8 lg:gap-10">
              {activeUser?.role === 'ADMIN' && (
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-theme-secondary mb-1">Live Net Revenue</span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_#10b981]" />
                    <span className="text-2xl lg:text-3xl font-bold tracking-tighter text-emerald-500">
                      {liveRevenue !== null ? `₹${liveRevenue.toLocaleString('en-IN')}` : '—'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-5 lg:gap-6">
                {activeTab === 'floor' && (
                  <>
                    <div className="relative" ref={addMenuRef}>
                      <button onClick={() => setShowAddMenu(v => !v)}
                        className="px-5 py-2.5 bg-emerald-500 text-black rounded-xl font-bold uppercase tracking-widest text-[10px] lg:text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shrink-0 whitespace-nowrap">
                        + Table
                      </button>
                      {showAddMenu && (
                        <div className="absolute top-full right-0 mt-3 w-56 rounded-2xl shadow-2xl z-[200] overflow-hidden glass-card noise-bg border border-theme-surface">
                          <div className="px-5 py-3 border-b border-theme-surface">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-theme-secondary">Select Section</p>
                          </div>
                          {sections.map(sec => (
                            <button key={sec} onClick={() => { 
                              setAddingTableSection(sec);
                              setNewTableName(`Table ${tables.filter(t => t.section === sec).length + 1}`);
                              setNewTableCapacity(4);
                              setShowAddMenu(false); 
                            }}
                              className="w-full px-5 py-4 text-left text-sm font-bold text-theme-primary hover:bg-emerald-500 hover:text-black transition-colors border-b border-theme-surface last:border-0">
                              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', marginRight: 8, backgroundColor: sectionConfig[sec]?.color || '#888' }} />
                              {sec}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {isEditMode && (
                      <button
                        onClick={() => {
                          tables.forEach(t => {
                            const snapGrid = 20;
                            const snappedX = Math.max(0, Math.round(t.position.x / snapGrid) * snapGrid);
                            const snappedY = Math.max(0, Math.round(t.position.y / snapGrid) * snapGrid);
                            moveTable(t.id, { x: snappedX, y: snappedY });
                          });
                        }}
                        className="px-5 py-2.5 bg-zinc-900 border border-theme-surface hover:border-emerald-500/30 text-theme-secondary hover:text-emerald-500 rounded-xl font-bold uppercase tracking-widest text-[10px] lg:text-xs transition-all shrink-0 whitespace-nowrap"
                      >
                        ⚡ Align Grid
                      </button>
                    )}

                    <button onClick={() => setIsEditMode(!isEditMode)}
                      className={`px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] lg:text-xs transition-all border-2 shrink-0 whitespace-nowrap edit-map-btn ${
                        isEditMode ? 'bg-rose-500 border-rose-500 text-white shadow-[0_0_25px_rgba(244,63,94,0.3)]' : 'border-theme-surface text-theme-secondary hover:text-theme-primary hover:border-theme-primary/30'
                      }`}>
                      {isEditMode ? 'Save Layout' : 'Edit Map'}
                    </button>
                  </>
                )}

                <div 
                  onClick={async () => {
                    await fetchLicenseInfo();
                    setShowLicenseModal(true);
                  }}
                  className="flex flex-col items-end mr-1 shrink-0 trial-info-badge transition-all cursor-pointer hover:opacity-80"
                  title="Click to view License details"
                >
                  {isTrial ? (
                    <div className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full mb-1 animate-pulse">
                      <span className="text-[7px] font-bold uppercase tracking-[0.1em] text-amber-500">
                        TRIAL: {trialDays !== null ? `${trialDays} DAYS LEFT` : 'ACTIVE'}
                      </span>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full mb-1">
                      <span className="text-[7px] font-bold uppercase tracking-[0.1em] text-emerald-400">
                        LICENSE ACTIVE
                      </span>
                    </div>
                  )}
                  <span className="text-[10px] font-bold uppercase text-emerald-500 tracking-tighter leading-none mb-0.5">{activeUser?.name}</span>
                  <span className="text-[8px] font-bold uppercase text-theme-secondary tracking-widest leading-none">{activeUser?.role}</span>
                </div>

                <button
                  onClick={() => setShowMobileConnect(true)}
                  className="px-4 py-2 border border-theme-surface text-theme-secondary hover:text-emerald-500 hover:border-emerald-500/30 rounded-xl font-bold uppercase tracking-widest text-[9px] lg:text-[10px] transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5"
                  title="Connect Waitstaff Mobile PWA"
                >
                  <span>📱</span> Connect Mobile
                </button>

                <ThemeToggle />
                <button
                  onClick={() => setShowTour(true)}
                  className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-xs hover:bg-emerald-500 hover:text-black transition-colors"
                  title="Replay Quick Help Tour"
                >
                  ℹ️
                </button>
                {isElectron && (
                  <>
                    <button
                      onClick={() => (window as any).electron.minimize()}
                      className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-xs hover:bg-zinc-800 hover:text-white transition-colors"
                      title="Minimize Window"
                    >
                      ➖
                    </button>
                    <button
                      onClick={() => (window as any).electron.close()}
                      className="w-8 h-8 rounded-full border border-rose-500/20 hover:border-rose-500/40 flex items-center justify-center text-xs hover:bg-rose-600/20 text-rose-400 hover:text-rose-200 transition-colors"
                      title="Close Window"
                    >
                      ✕
                    </button>
                  </>
                )}
                <div className="h-8 w-px bg-theme-surface mx-1" />
                <LiveClock />
              </div>
            </div>
          </div>

          {/*
           * ── Scrollable content area ───────────────────────────────────────────
           * flex:1 fills remaining height. We use a relative wrapper and an 
           * absolute inset-0 inner div. This completely hides the inner scrolling 
           * height from Chromium's flexbox engine, elegantly fixing the ~60% 
           * width collapse bug without resorting to hardcoded calc() widths!
           */}
          <div className="flex-1 min-h-0 w-full relative">
            <div className="absolute inset-0 overflow-y-auto px-8 py-8 pb-20 custom-scrollbar">
            {activeTab === 'floor' ? (
              <div className="space-y-16">
                <ErrorBoundary label="Floor Map">
                  <DndContext sensors={sensors} onDragEnd={handleDragEnd} modifiers={[restrictToFirstScrollableAncestor]}>
                    {sections.map(section => {
                      const cfg = sectionConfig[section] ?? { height: 300, color: '#888' };
                      return (
                        <div key={section}>
                          {/* Section header */}
                          <div
                            className="mb-5 pb-4 flex items-end justify-between"
                            style={{ borderBottom: `3px solid ${cfg.color}22` }}
                          >
                            <div className="flex items-center gap-4">
                              <div style={{ width: 4, height: 32, borderRadius: 4, backgroundColor: cfg.color }} />
                              <h3 className="text-2xl font-bold tracking-tighter uppercase">{section}</h3>
                            </div>
                            <span style={{ color: 'var(--text-secondary)' }} className="text-[10px] font-bold uppercase tracking-widest">
                              {tables.filter(t => t.section === section).length} tables ·{' '}
                              {tables.filter(t => t.section === section && t.status !== 'VACANT').length} active
                            </span>
                          </div>

                          {/* Section canvas */}
                          <div
                            style={{
                              width: '100%',
                              overflowX: 'auto',
                              overflowY: 'hidden',
                              borderRadius: 24,
                              border: '1px solid var(--surface-border)',
                              backgroundColor: 'rgba(0,0,0,0.02)',
                            }}
                            className="custom-scrollbar"
                          >
                            <div
                              style={{
                                height: cfg.height,
                                position: 'relative',
                                minWidth: '768px',
                                width: '100%',
                                border: `2px ${isEditMode ? 'dashed' : 'solid'} ${isEditMode ? cfg.color + '44' : 'var(--surface-border)'}`,
                                backgroundColor: isEditMode ? cfg.color + '08' : 'rgba(0,0,0,0.03)',
                                backgroundImage: isEditMode
                                  ? 'linear-gradient(to right, var(--surface-border) 1px, transparent 1px), linear-gradient(to bottom, var(--surface-border) 1px, transparent 1px)'
                                  : 'none',
                                backgroundSize: '20px 20px',
                                transition: 'background-color 0.3s, border-color 0.3s, background-image 0.3s',
                              }}
                              className="floor-map-canvas"
                            >
                              {tables.filter(t => t.section === section).map(table => (
                                <DraggableTable
                                  key={table.id}
                                  {...table}
                                  isDraggable={isEditMode}
                                  onClick={handleTableClick}
                                />
                              ))}

                              {/* Resize handle */}
                              {isEditMode && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: 24,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'ns-resize',
                                    userSelect: 'none',
                                    backgroundColor: cfg.color + '18',
                                    borderRadius: '0 0 24px 24px',
                                  }}
                                  onMouseDown={e => {
                                    e.preventDefault();
                                    const startY = e.clientY;
                                    const startH = cfg.height;
                                    const move = (m: MouseEvent) => setSectionHeight(section, startH + (m.clientY - startY));
                                    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
                                    window.addEventListener('mousemove', move);
                                    window.addEventListener('mouseup', up);
                                  }}
                                >
                                  <div style={{ width: 64, height: 6, borderRadius: 999, backgroundColor: cfg.color + '60' }} />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </DndContext>
                </ErrorBoundary>
              </div>
            ) : (
              <div style={{ height: '100%', minHeight: '100%' }}>
                {TAB_VIEWS[activeTab]}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>

      {/* Floating re-open button */}
      {!isPanelOpen && selectedTableId && activeTab === 'floor' && (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="fixed right-10 bottom-20 w-20 h-20 bg-emerald-500 text-black rounded-full flex flex-col items-center justify-center text-2xl hover:scale-110 transition-all z-[90] shadow-xl"
        >
          📝
          <span className="text-[8px] font-bold uppercase mt-1">Order</span>
        </button>
      )}

      {/* Order Side Panel */}
      <ErrorBoundary label="Order Panel">
        <OrderSidePanel
          isOpen={isPanelOpen}
          tableId={selectedTableId || ''}
          onClose={() => setIsPanelOpen(false)}
        />
      </ErrorBoundary>

      {/* Walkthrough Overlay */}
      <Walkthrough
        isOpen={showTour}
        onClose={() => setShowTour(false)}
      />

      {/* Create Table Modal */}
      {addingTableSection && (
        <div
          className="fixed inset-0 z-[600] flex items-center justify-center p-6 animate-in fade-in duration-250"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
          onClick={() => setAddingTableSection(null)}
        >
          <div
            style={{ backgroundColor: 'var(--surface-color)' }}
            className="p-8 rounded-3xl flex flex-col max-w-sm w-full shadow-2xl border border-white/10 noise-bg relative"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold tracking-tighter uppercase mb-2 text-white">Create Table</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-6 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 w-fit">
              Section: {addingTableSection}
            </p>
            
            <div className="mb-4 group">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2 group-focus-within:text-emerald-500 transition-colors">Table Name</label>
              <input
                type="text"
                autoFocus
                value={newTableName}
                onChange={e => setNewTableName(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-6 py-4 text-white text-lg font-bold outline-none focus:border-emerald-500 transition-colors"
                placeholder="e.g. Table 12, VIP 1..."
              />
            </div>

            <div className="mb-8 group">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2 group-focus-within:text-emerald-500 transition-colors">Capacity (Pax)</label>
              <input
                type="number"
                value={newTableCapacity}
                onChange={e => setNewTableCapacity(Number(e.target.value))}
                min={1}
                max={24}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-6 py-4 text-white text-lg font-bold outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setAddingTableSection(null)}
                className="flex-1 py-4 bg-white/5 text-zinc-400 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white/10 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newTableName.trim()) {
                    addTable(addingTableSection, newTableName.trim(), newTableCapacity);
                    setAddingTableSection(null);
                  }
                }}
                disabled={!newTableName.trim()}
                className="flex-1 py-4 bg-emerald-500 text-black rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-400 transition-colors shadow-lg disabled:opacity-50"
              >
                Create Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect Mobile Modal */}
      {showMobileConnect && (
        <div
          className="fixed inset-0 z-[600] flex items-center justify-center p-6 animate-in fade-in duration-250"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
          onClick={() => setShowMobileConnect(false)}
        >
          <div
            style={{ backgroundColor: 'var(--surface-color)' }}
            className="p-8 rounded-3xl flex flex-col items-center max-w-sm w-full shadow-2xl border border-white/10 noise-bg relative text-center animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <p style={{ color: 'var(--text-secondary)' }} className="text-[9px] font-bold uppercase tracking-widest mb-2">WIRELESS ORDERING SYSTEM</p>
            <h3 className="text-2xl font-bold tracking-tighter uppercase mb-6 text-white">Connect Waitstaff Mobile</h3>

            {/* QR Code Container */}
            <div className="w-56 h-56 bg-white p-4 rounded-2xl mb-6 shadow-lg flex items-center justify-center border border-zinc-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`http://${hostIp}:3002/waitstaff`)}`}
                alt="Waitstaff PWA QR Code"
                className="w-full h-full"
              />
            </div>

            {/* Instructions */}
            <div className="space-y-3.5 mb-8 text-left w-full">
              <div className="flex gap-3">
                <span className="text-lg">📶</span>
                <p className="text-xs text-zinc-400 font-medium leading-tight">
                  Connect the phone or tablet to the <strong className="text-white">same local Wi-Fi</strong> network.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-lg">📷</span>
                <p className="text-xs text-zinc-400 font-medium leading-tight">
                  Scan this QR code or open <strong className="text-emerald-400 break-all select-all">http://{hostIp}:3002/waitstaff</strong> in the mobile browser.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-lg">📲</span>
                <p className="text-xs text-zinc-400 font-medium leading-tight">
                  Tap <strong className="text-white">"Add to Home Screen"</strong> to install the standalone app instantly.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowMobileConnect(false)}
              className="w-full py-4 bg-emerald-500 text-black rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-400 transition-colors shadow-lg"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* License / Trial Information Modal */}
      {showLicenseModal && licenseInfo && (
        <div
          className="fixed inset-0 z-[600] flex items-center justify-center p-6 animate-in fade-in duration-250"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
          onClick={() => setShowLicenseModal(false)}
        >
          <div
            style={{ backgroundColor: 'var(--surface-color)' }}
            className="p-8 md:p-10 rounded-3xl flex flex-col max-w-md w-full shadow-2xl border border-white/10 noise-bg relative animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold tracking-tighter uppercase text-white">License Details</h3>
              <button
                onClick={() => setShowLicenseModal(false)}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-xs hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Trial Status Badge */}
            <div className="mb-6 flex justify-between items-center bg-zinc-950/40 p-4 rounded-xl border border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Current Status</span>
              {isTrial ? (
                <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  ⚠️ TRIAL: {trialDays} Days Left
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                  ✓ License Active
                </span>
              )}
            </div>

            {/* Machine Details / Hardware ID */}
            <div className="mb-6">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Machine Hardware ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={licenseInfo.hardwareId || 'UNKNOWN'}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono font-bold text-emerald-400 text-center focus:outline-none"
                />
                <button
                  onClick={handleCopyHardwareId}
                  className="px-4 py-3 bg-zinc-900 border border-white/10 hover:border-emerald-500/30 text-zinc-300 hover:text-emerald-400 rounded-xl font-bold uppercase tracking-widest text-[9px] transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Developer / Partner Details */}
            <div className="mb-8 p-4 rounded-xl bg-zinc-950/20 border border-white/5 text-left">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Partner Details</label>
              <p className="text-xs text-white font-bold mb-1">RSK Solutions</p>
              <p className="text-[11px] text-zinc-400 mb-1">Developer: <span className="text-zinc-300 font-semibold">Sudesh Kanade</span></p>
              <p className="text-[11px] text-zinc-400 mb-3">Email: <a href="mailto:support@rsk.solutions" className="text-emerald-400 hover:underline">support@rsk.solutions</a></p>
              <p className="text-[10px] text-zinc-500 leading-tight italic">
                * Send your Machine Hardware ID to get a permanent activation key.
              </p>
            </div>

            {/* Activation field (Only if in Trial mode) */}
            {isTrial && (
              <div className="mb-2">
                <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Enter Activation Key</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="RSK-XXXX-XXXX-XXXX"
                    value={activationKey}
                    onChange={e => setActivationKey(e.target.value.toUpperCase())}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white text-center placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {activationError && (
                    <p className="text-rose-500 font-bold text-[10px] uppercase tracking-wider text-center">{activationError}</p>
                  )}
                  <button
                    onClick={handleActivate}
                    disabled={activating || !activationKey.trim()}
                    className={`w-full py-4 mt-2 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${
                      activating || !activationKey.trim()
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-emerald-500 text-black hover:scale-[1.02] shadow-lg'
                    }`}
                  >
                    {activating ? 'Activating...' : 'Activate System'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
