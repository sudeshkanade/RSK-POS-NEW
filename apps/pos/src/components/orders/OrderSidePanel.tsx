'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MenuSearch } from './MenuSearch';
import { usePOSStore, useOrderTotal, PaymentMethod } from '../../store/posStore';

const VOID_REASONS = ['Customer Changed Mind', 'Wrong Order', 'Allergy / Dietary', 'Item Unavailable', 'Duplicate Entry'];

export const OrderSidePanel: React.FC<{ isOpen: boolean; onClose: () => void; tableId: string; }> = ({ isOpen, onClose, tableId }) => {
  const {
    tables, orders, addItem, updateItemQty, voidItem,
    markKOTSent, settleOrder, updateTableStatus, activeUser, transferOrder
  } = usePOSStore();

  const table = tables.find(t => t.id === tableId);
  const order = orders[tableId] ?? { tableId, items: [], paymentMethod: null, openedAt: '' };
  const total = useOrderTotal(tableId);

  // Local UI state
  const [receipt, setReceipt]           = useState<string | null>(null);
  const [pendingKOT, setPendingKOT]     = useState(false);
  const [settled, setSettled]           = useState(false);
  const [voidTarget, setVoidTarget]     = useState<string | null>(null);
  const [showPayment, setShowPayment]   = useState(false);
  const [menuItems, setMenuItems]       = useState<any[]>([]);
  const [isPrinting, setIsPrinting]     = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  
  // Split payment state
  const [splits, setSplits] = useState({ CASH: 0, CARD: 0, UPI: 0 });
  const [activeSplit, setActiveSplit] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const printIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetch('/api/menu')
      .then(r => r.json())
      .then(data => { 
        if (Array.isArray(data)) {
          setMenuItems(data.flatMap(cat => cat.items.map((i: any) => ({ ...i, categoryName: cat.name }))));
        } 
      })
      .catch(e => console.error(e));
  }, []);

  // Reset splits when modal opens
  useEffect(() => {
    if (showPayment) {
      setSplits({ CASH: total, CARD: 0, UPI: 0 });
      setCustomerName('');
      setCustomerPhone('');
    }
  }, [showPayment, total]);

  const activeItems = order.items.filter(i => !i.isVoided);
  const newItems    = activeItems.filter(i => i.isNew);

  // ── Printing ──────────────────────────────────────────────────────────────
  const buildReceipt = async (type: 'KOT' | 'PRO_FORMA' | 'FINAL' | 'GST_BILL'): Promise<string> => {
    const W = 42;
    const ctr = (s: string) => ' '.repeat(Math.max(0, Math.floor((W - s.length) / 2))) + s;
    const hr  = '-'.repeat(W);
    const date = new Date().toLocaleString('en-IN');
    const items = type === 'KOT' ? newItems : activeItems;

    if (type === 'KOT' && items.length === 0) return '⚠️ No new items to send to kitchen.';

    // Fetch restaurant details and GST settings once for billing types
    let restName = 'RestroOS';
    let restAddress = '';
    let restPhone = '';
    let gstNo = '';
    let gstRate = 0;

    if (type !== 'KOT') {
      try {
        const s = await fetch('/api/settings').then(r => r.json());
        if (!s.error) {
          restName    = s.name    || 'RestroOS';
          restAddress = s.address || '';
          restPhone   = s.phone   || '';
          gstNo       = s.gstNo   || '';
          gstRate     = typeof s.gstRate === 'number' ? s.gstRate : 0;
        }
      } catch { /* use defaults */ }
    }

    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const taxAmount = Math.round(subtotal * gstRate) / 100;
    const grandTotal = subtotal + taxAmount;
    const halfGst = taxAmount / 2;

    let r = `\n${ctr(restName)}\n`;
    if (restAddress) r += `${ctr(restAddress)}\n`;
    if (restPhone)   r += `${ctr('Ph: ' + restPhone)}\n`;
    if (gstNo && type === 'GST_BILL') r += `${ctr('GSTIN: ' + gstNo)}\n`;

    if (type === 'KOT') {
      const isBar = (cat?: string) => {
        if (!cat) return false;
        const c = cat.toLowerCase();
        return c.includes('bar') || c.includes('beverage') || c.includes('drink') || c.includes('liquor') || c.includes('alcohol');
      };

      const barItems = items.filter(i => isBar(i.categoryName));
      const kitchenItems = items.filter(i => !isBar(i.categoryName));

      let kotText = '';
      if (kitchenItems.length > 0) {
        kotText += `${ctr('KITCHEN ORDER TICKET')}\n`;
        kotText += `${hr}\nDate: ${date}\nTable: ${table?.name || tableId}\n${hr}\n`;
        kotText += `${'ITEM'.padEnd(30)}QTY\n${hr}\n`;
        kitchenItems.forEach(i => {
          kotText += `${i.name.substring(0, 28).padEnd(30)}${String(i.qty).padStart(3)}\n`;
        });
      }

      if (barItems.length > 0) {
        if (kotText) kotText += `\n\n\n\n--- CUT HERE ---\n\n\n\n`;
        kotText += `${ctr('BAR ORDER TICKET')}\n`;
        kotText += `${hr}\nDate: ${date}\nTable: ${table?.name || tableId}\n${hr}\n`;
        kotText += `${'ITEM'.padEnd(30)}QTY\n${hr}\n`;
        barItems.forEach(i => {
          kotText += `${i.name.substring(0, 28).padEnd(30)}${String(i.qty).padStart(3)}\n`;
        });
      }
      r += kotText;
    } else {
      const title = type === 'GST_BILL' ? 'TAX INVOICE' : 
                    type === 'PRO_FORMA' ? 'PRELIMINARY CHECK' : 'INVOICE';
      r += `${ctr(title)}\n`;
      r += `${hr}\nDate: ${date}\nTable: ${table?.name || tableId}\n${hr}\n`;
      r += `${'ITEM'.padEnd(19)}${'QTY'.padStart(3).padEnd(7)}${'PRICE'.padStart(8).padEnd(11)}TOTAL\n${hr}\n`;
      items.forEach(i => {
        r += `${i.name.substring(0, 18).padEnd(19)}${String(i.qty).padStart(3).padEnd(7)}${('₹' + i.price).padStart(8).padEnd(11)}₹${(i.price * i.qty).toFixed(2)}\n`;
      });
      r += `${hr}\n`;
      r += `${'Subtotal'.padEnd(30)}₹${subtotal.toFixed(2).padStart(10)}\n`;

      if (type === 'GST_BILL' && gstRate > 0) {
        const halfRate = (gstRate / 2).toFixed(1);
        r += `${('CGST @ ' + halfRate + '%').padEnd(30)}₹${halfGst.toFixed(2).padStart(10)}\n`;
        r += `${('SGST @ ' + halfRate + '%').padEnd(30)}₹${halfGst.toFixed(2).padStart(10)}\n`;
      }

      r += `${hr}\n`;
      r += `${'GRAND TOTAL'.padEnd(30)}₹${(type === 'GST_BILL' ? grandTotal : subtotal).toFixed(2).padStart(10)}\n`;
      r += `${hr}\n`;

      if (order.paymentMethod) {
        r += `${'Payment'.padEnd(30)}${order.paymentMethod.padStart(10)}\n`;
      }
      if (customerName || customerPhone) {
        r += `${hr}\nCustomer: ${customerName}\nPhone: ${customerPhone}\n`;
      }
      r += `${hr}\n\n${ctr(type === 'FINAL' ? 'Thank you! Visit again.' : '*** THIS IS NOT A BILL ***')}\n`;
      if (type === 'PRO_FORMA') r += `${ctr('PRELIMINARY CHECK')}\n`;
    }
    return r;
  };


  const confirmPrint = async () => {
    if (!receipt) return;
    setIsPrinting(true);
    
    let tcpSuccess = false;
    try {
      const res = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: receipt })
      });
      const data = await res.json();
      if (data.success) tcpSuccess = true;
    } catch (e) {
      console.error('TCP print failed', e);
    }

    if (!tcpSuccess) {
      // Fallback to browser print if hardware TCP fails
      if (printIframeRef.current) {
        const doc = printIframeRef.current.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(`
            <html><head>
              <style>
                body { font-family: monospace; font-size: 12px; width: 80mm; margin: 0; white-space: pre-wrap; word-wrap: break-word; }
                @media print { @page { margin: 0; } }
              </style>
            </head><body>${receipt.replace(/\n/g, '<br/>')}</body></html>
          `);
          doc.close();
          setTimeout(() => {
            printIframeRef.current?.contentWindow?.focus();
            printIframeRef.current?.contentWindow?.print();
          }, 200);
        }
      }
    }

    if (pendingKOT) markKOTSent(tableId);
    setPendingKOT(false);
    setReceipt(null);
    setIsPrinting(false);
  };

  const printKOT = async () => { setReceipt(await buildReceipt('KOT')); setPendingKOT(true); };
  const printCheck = async () => { setReceipt(await buildReceipt('PRO_FORMA')); updateTableStatus(tableId, 'BILL_PRINTED'); };
  const printGSTBill = async () => { setReceipt(await buildReceipt('GST_BILL')); updateTableStatus(tableId, 'BILL_PRINTED'); };

  // ── Payment Split Logic ──────────────────────────────────────────────────
  const totalPaid = splits.CASH + splits.CARD + splits.UPI;
  const remaining = total - totalPaid;

  const handleSplitChange = (method: 'CASH' | 'CARD' | 'UPI', val: string) => {
    const num = parseInt(val, 10);
    setSplits(prev => ({ ...prev, [method]: isNaN(num) ? 0 : num }));
  };

  const [showSettleConfirm, setShowSettleConfirm] = useState(false);

  const settle = async () => {
    if (!showSettleConfirm) {
      setShowSettleConfirm(true);
      return;
    }

    // We only care about saving the string, e.g. "CASH:100, CARD:50"
    const methodStr = Object.entries(splits).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(', ');
    
    // Custom settlement to bypass posStore's setPaymentMethod which takes a strict type
    usePOSStore.setState(s => {
      const ord = s.orders[tableId];
      if (ord) ord.paymentMethod = methodStr as any;
      return { orders: { ...s.orders } };
    });

    setSettled(true);
    try {
      await settleOrder(tableId);
      setShowSettleConfirm(false);
      setTimeout(() => { setSettled(false); setShowPayment(false); onClose(); }, 1500);
    } catch (e) {
      console.error('Settlement failed', e);
      setSettled(false);
      alert('Failed to settle order. Please try again.');
    }
  };

  const STATUS_COLOR: Record<string, string> = {
    VACANT: '#10b981', OCCUPIED: '#f59e0b',
    BILL_PRINTED: '#f43f5e', PAYMENT_PENDING: '#a855f7', SETTLED: '#0ea5e9',
  };
  const status = table?.status || 'VACANT';
  const statusColor = STATUS_COLOR[status] || '#10b981';

  return (
    <>
      <iframe ref={printIframeRef} style={{ display: 'none' }} title="Print Frame" />
      
      <div onClick={onClose}
        className={`fixed inset-0 z-[100] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} />

      <div
        style={{ transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
        className={`!fixed !top-0 !right-0 !bottom-0 h-full w-full sm:w-[85%] md:w-[60%] lg:w-[45%] xl:w-[40%] z-[101] shadow-[-30px_0_60px_rgba(0,0,0,0.4)] flex flex-col glass-card border-l border-theme-surface noise-bg ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {settled && (
          <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl z-20 flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 flex items-center justify-center rounded-3xl text-5xl mb-6 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
              ✓
            </div>
            <h3 className="text-3xl font-bold uppercase text-white tracking-tighter">Order Settled</h3>
            <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-4">Table is now Vacant</p>
          </div>
        )}

        {showTransfer && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 backdrop-blur-md bg-black/60">
            <div className="glass-card p-8 rounded-2xl w-full max-w-sm border border-theme-surface bg-zinc-900/90 shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold uppercase tracking-widest text-white mb-6">Transfer Order</h3>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-4">Select Destination Table:</p>
              
              <div className="max-h-[40vh] overflow-y-auto custom-scrollbar mb-6 border border-white/10 rounded-xl bg-black/30">
                {tables.filter(t => t.id !== tableId).map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      transferOrder(tableId, t.id);
                      setShowTransfer(false);
                      onClose();
                    }}
                    className="w-full p-4 flex items-center justify-between border-b border-white/5 last:border-0 hover:bg-emerald-500/20 group transition-colors"
                  >
                    <span className="font-bold text-white group-hover:text-emerald-400">{t.name}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${t.status === 'VACANT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                      {t.status}
                    </span>
                  </button>
                ))}
                {tables.filter(t => t.id !== tableId).length === 0 && (
                  <div className="p-6 text-center text-zinc-500 text-xs font-bold uppercase">No other tables available</div>
                )}
              </div>

              <button
                onClick={() => setShowTransfer(false)}
                className="w-full py-4 bg-zinc-800 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {voidTarget && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-8 backdrop-blur-md" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid rgba(255,255,255,0.05)' }} className="p-8 rounded-xl w-full max-w-sm shadow-2xl">
              <h3 className="text-xl font-bold uppercase mb-6 tracking-tight text-white">Void Reason</h3>
              <div className="space-y-2 mb-6">
                {VOID_REASONS.map(r => (
                  <button key={r} onClick={() => { voidItem(tableId, voidTarget, r); setVoidTarget(null); }}
                    className="w-full px-5 py-3 rounded-sm text-left font-bold text-sm bg-zinc-900/50 text-zinc-300 border border-white/5 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-all">
                    {r}
                  </button>
                ))}
              </div>
              <button onClick={() => setVoidTarget(null)} className="w-full py-3 font-bold uppercase tracking-widest text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {showPayment && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 md:p-6 backdrop-blur-md" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
            <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid rgba(255,255,255,0.08)' }} className="p-6 md:p-10 rounded-xl md:rounded-xl w-full max-w-2xl mx-4 my-auto shadow-[0_40px_100px_rgba(0,0,0,0.5)] flex flex-col relative overflow-y-auto max-h-[90vh] custom-scrollbar">
              <div className="flex justify-between items-center mb-8 shrink-0">
                <h3 className="text-2xl font-bold uppercase tracking-tight text-white">Collect Payment</h3>
                <button onClick={() => setShowPayment(false)} className="px-4 py-2 bg-zinc-900/50 rounded-xl text-zinc-500 hover:text-rose-400 font-bold uppercase tracking-widest text-[10px] transition-all">Cancel</button>
              </div>

              <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                {/* Left: Input Fields */}
                <div className="w-full md:w-1/2 flex flex-col gap-6 md:gap-8">
                  {(['CASH', 'CARD', 'UPI'] as const).map(m => (
                    <div key={m} className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                        {m === 'CASH' ? '💵 Cash' : m === 'CARD' ? '💳 Card' : '📱 UPI'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={splits[m] || ''}
                        onChange={(e) => handleSplitChange(m, e.target.value)}
                        placeholder="0"
                        className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl p-4 text-2xl font-bold text-white focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-950 transition-all shadow-inner"
                      />
                      {m === 'CASH' && (
                        <div className="flex gap-1.5 flex-wrap mt-1">
                          <button
                            type="button"
                            onClick={() => setSplits(prev => ({ ...prev, CASH: total }))}
                            className="px-2.5 py-1.5 bg-zinc-900 border border-white/5 hover:border-emerald-500/30 text-zinc-400 hover:text-emerald-400 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors"
                          >
                            Exact
                          </button>
                          {[100, 200, 500, 2000].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setSplits(prev => ({ ...prev, CASH: val }))}
                              className="px-2.5 py-1.5 bg-zinc-900 border border-white/5 hover:border-emerald-500/30 text-zinc-400 hover:text-emerald-400 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors"
                            >
                              ₹{val}
                            </button>
                          ))}
                        </div>
                      )}
                      {(m === 'CARD' || m === 'UPI') && (
                        <div className="flex gap-1.5 flex-wrap mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const currentOther = Object.entries(splits)
                                .filter(([k]) => k !== m)
                                .reduce((sum, [, v]) => sum + v, 0);
                              const remainingBal = Math.max(0, total - currentOther);
                              setSplits(prev => ({ ...prev, [m]: remainingBal }));
                            }}
                            className="px-2.5 py-1.5 bg-zinc-900 border border-white/5 hover:border-emerald-500/30 text-zinc-400 hover:text-emerald-400 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors"
                          >
                            ⚡ Fill Balance
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Right: Summary & Action */}
                <div className="w-full md:w-1/2 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-baseline mb-6 pb-6 border-b border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">Grand Total</span>
                      <span className="text-4xl md:text-5xl font-bold text-white tracking-tighter">₹{total.toFixed(2)}</span>
                    </div>

                    <div className="flex flex-col gap-4">
                      {remaining > 0 && (
                        <div className="bg-amber-500/[0.03] border border-amber-500/10 p-4 rounded-2xl flex flex-col gap-3">
                          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-amber-500/80">Partial Payment Info</span>
                          <input
                            type="text"
                            placeholder="Customer Name"
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value.substring(0, 30))}
                            maxLength={30}
                            className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-zinc-300 focus:outline-none focus:border-amber-500/40"
                          />
                          <input
                            type="tel"
                            placeholder="Phone Number"
                            value={customerPhone}
                            onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, '').substring(0, 15))}
                            maxLength={15}
                            className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-zinc-300 focus:outline-none focus:border-amber-500/40"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 mt-6">
                    <div className="flex justify-between items-center px-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">Pending</span>
                      <span className={`text-xl md:text-2xl font-bold ${remaining === 0 ? 'text-emerald-500' : remaining < 0 ? 'text-amber-500' : 'text-rose-500'}`}>
                        {remaining < 0 ? `Change: ₹${Math.abs(remaining)}` : `₹${remaining.toFixed(2)}`}
                      </span>
                    </div>
                    <button 
                      onClick={settle}
                      disabled={remaining > 0 && (!customerName.trim() || !customerPhone.trim())}
                      className={`w-full py-3 rounded-sm font-bold uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl ${
                        showSettleConfirm ? 'bg-amber-500 text-black shadow-[0_0_40px_rgba(245,158,11,0.2)]' :
                        remaining <= 0 || (customerName && customerPhone) ? 'bg-emerald-500 text-black hover:brightness-110 active:scale-95' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                      }`}
                    >
                      {showSettleConfirm ? 'Tap again to Confirm' : 'Confirm Settlement'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Standard Panel Content ── */}
        <div className="flex flex-col h-full p-8 overflow-hidden">
          <div className="flex justify-between items-start mb-6 shrink-0">
            <div>
              <p style={{ color: statusColor }} className="text-xs font-bold uppercase tracking-widest mb-1">
                {status.split('_').join(' ')}
              </p>
              <h3 className="text-5xl font-bold tracking-tighter uppercase leading-none">
                {table?.name || '—'}
              </h3>
              <p style={{ color: 'var(--text-secondary)' }} className="text-[10px] font-bold uppercase tracking-widest mt-1">
                Capacity: {table?.capacity || 0} · {table?.section || ''}
              </p>
            </div>
            <button onClick={onClose}
              style={{ backgroundColor: 'rgba(0,0,0,0.08)', color: 'var(--text-secondary)' }}
              className="p-3 rounded-2xl hover:text-rose-500 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {newItems.length > 0 && (
            <div className="mb-4 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 shrink-0">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-widest">⚠️ {newItems.length} new item{newItems.length > 1 ? 's' : ''} pending KOT</span>
            </div>
          )}

          <div className="mb-5 shrink-0">
            <MenuSearch 
              items={menuItems} 
              autoFocus={isOpen}
              onItemSelect={item => addItem(tableId, { id: Date.now().toString(), name: item.name, qty: 1, price: item.price })} 
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pr-1">
            {activeItems.length === 0 && order.items.filter(i => i.isVoided).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-35">
                <span className="text-5xl mb-4">🍽️</span>
                <p className="font-bold uppercase tracking-[0.2em] text-[10px] text-zinc-500">Cart is Empty</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04] pb-4">
                {order.items.map(item => (
                  <div key={item.id}
                    style={{ opacity: item.isVoided ? 0.5 : 1 }}
                    className="flex items-center justify-between py-3.5 px-1 gap-4 transition-all"
                  >
                    {/* Item Information */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-sm tracking-tight text-white ${item.isVoided ? 'line-through text-zinc-600' : ''}`}>
                          {item.name}
                        </span>
                        {item.isNew && !item.isVoided && (
                          <span className="text-[8px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">KOT Pending</span>
                        )}
                        {item.isVoided && (
                          <span className="text-[8px] font-bold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-md uppercase tracking-wider">Voided</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-zinc-500">₹{item.price} × {item.qty}</span>
                        {item.addedBy && !item.isVoided && (
                          <span className="text-[8px] font-semibold text-zinc-600 uppercase tracking-widest">· By {item.addedBy}</span>
                        )}
                        {item.isVoided && item.voidedBy && (
                          <span className="text-[8px] font-semibold text-rose-500/50 uppercase tracking-widest">· By {item.voidedBy} ({item.voidReason})</span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Control & Voids */}
                    {!item.isVoided ? (
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center bg-zinc-900/40 border border-white/5 rounded-xl overflow-hidden p-0.5">
                          <button onClick={() => updateItemQty(tableId, item.id, -1)} 
                            className="w-7 h-7 flex items-center justify-center font-bold text-base text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">−</button>
                          <span className="w-8 text-center font-bold text-sm text-white">{item.qty}</span>
                          <button onClick={() => updateItemQty(tableId, item.id, 1)} 
                            className="w-7 h-7 flex items-center justify-center font-bold text-base text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">+</button>
                        </div>
                        
                        <span className="w-16 text-right font-bold text-sm italic text-white">₹{item.price * item.qty}</span>
                        
                        <button onClick={() => {
                          if (activeUser?.role !== 'ADMIN' && activeUser?.role !== 'MANAGER') {
                            alert('Manager permission required for voiding items');
                            return;
                          }
                          setVoidTarget(item.id);
                        }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center bg-zinc-900/20 border border-white/5 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition-all text-xs">
                          🗑️
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="w-16 text-right font-bold text-sm text-zinc-600 line-through">₹{item.price * item.qty}</span>
                        <div className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: '2px solid var(--surface-border)' }} className="pt-5 mt-4 shrink-0">
            <div className="flex justify-between items-baseline mb-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-theme-secondary">Grand Total</span>
                {order.items.some(i => i.isVoided) && (
                  <p className="text-rose-400 text-[9px] font-bold uppercase tracking-wider mt-0.5">
                    {order.items.filter(i => i.isVoided).length} item(s) voided
                  </p>
                )}
              </div>
              <span className="text-4xl font-bold tracking-tighter">₹{total.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => setShowTransfer(true)}
                style={{ border: '2px solid var(--surface-border)', color: 'var(--text-primary)' }}
                className="py-3 rounded-sm font-bold uppercase tracking-wider text-[9px] hover:bg-purple-500 hover:text-black hover:border-purple-500 transition-all">
                Transfer
              </button>
              <button onClick={printKOT}
                style={{ border: '2px solid var(--surface-border)', color: 'var(--text-primary)' }}
                className="py-3 rounded-sm font-bold uppercase tracking-wider text-[9px] hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all">
                Print KOT
              </button>
              <button onClick={printCheck}
                style={{ border: '2px solid var(--surface-border)', color: 'var(--text-primary)' }}
                className="py-3 rounded-sm font-bold uppercase tracking-wider text-[9px] hover:bg-sky-500 hover:text-black hover:border-sky-500 transition-all">
                Print Check
              </button>
              <button onClick={printGSTBill}
                style={{ border: '2px solid var(--surface-border)', color: 'var(--text-primary)' }}
                className="py-3 rounded-sm font-bold uppercase tracking-wider text-[9px] hover:bg-emerald-500 hover:text-black hover:border-emerald-500 transition-all">
                GST Bill
              </button>

              <button onClick={() => setShowPayment(true)} disabled={total === 0}
                className={`col-span-4 py-3 mt-1 rounded-sm font-bold uppercase tracking-widest text-sm transition-all shadow-lg ${
                  total > 0 ? 'bg-emerald-500 text-black hover:scale-[1.02]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}>
                ✓ Collect Payment
              </button>
            </div>
          </div>
        </div>
      </div>

      {receipt && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center p-8 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)' }}>
          <div className="digital-receipt rounded-sm shadow-2xl max-w-sm w-full animate-paper mb-6">
            <div className="p-10 font-mono text-[11px] leading-tight whitespace-pre overflow-y-auto max-h-[60vh] text-zinc-800">
              {receipt}
            </div>
            {/* Added bottom padding inside receipt so the jagged edge has empty space to draw on */}
            <div className="h-8"></div>
          </div>
          
          <div className="flex gap-4 w-full max-w-sm animate-paper" style={{ animationDelay: '0.1s' }}>
            <button onClick={() => { setReceipt(null); setPendingKOT(false); }}
              className="flex-1 py-4 bg-zinc-800/80 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-zinc-700 backdrop-blur-md border border-white/10 transition-all">
              Cancel
            </button>
            <button onClick={confirmPrint} disabled={isPrinting}
              className={`flex-1 py-4 font-bold uppercase tracking-widest text-xs rounded-xl backdrop-blur-md border border-white/10 transition-all ${
                isPrinting ? 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed' : 'bg-emerald-500/90 text-white hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              }`}>
              {isPrinting ? 'Printing...' : '✓ Confirm Print'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
