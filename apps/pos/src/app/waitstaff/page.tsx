'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../../services/socket.service';

/* ─── Types ───────────────────────────────────────────────── */
interface Table  { id: string; name: string; section: string; status: string; capacity: number; }
interface MenuItem { id: string; name: string; price: number; description?: string; shortcutKey?: string | null; }
interface Category { id: string; name: string; items: MenuItem[]; }
interface CartItem  { id: string; name: string; price: number; qty: number; }

type Screen = 'tables' | 'menu' | 'cart';

/* ─── Main Component ──────────────────────────────────────── */
export default function WaitstaffPage() {
  const [screen, setScreen]       = useState<Screen>('tables');
  const [tables, setTables]       = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [cart, setCart]           = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [sending, setSending]     = useState(false);
  const [toast, setToast]         = useState('');
  const [staffName, setStaffName] = useState('');
  const [loggedIn, setLoggedIn]   = useState(false);
  const [errorLog, setErrorLog]   = useState<string>('');
  const [staffList, setStaffList] = useState<{ id: string; name: string; isActive: boolean }[]>([]);
  const [existingOrderItems, setExistingOrderItems] = useState<{ name: string; qty: number; price: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Pure React focus, hover, and active states to replace unsafe style blocks
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isBtnHovered, setIsBtnHovered]     = useState(false);
  const [isBtnActive, setIsBtnActive]       = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleError = (e: ErrorEvent) => {
      setErrorLog(prev => prev + '\n' + e.message + ' (' + e.filename + ':' + e.lineno + ')');
    };
    const handleRejection = (e: PromiseRejectionEvent) => {
      setErrorLog(prev => prev + '\nUnhandled Rejection: ' + String(e.reason));
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  /* ─── Load data ─────────────────────────────────────────── */
  const loadTables = useCallback(async () => {
    try {
      const res = await fetch('/api/tables?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setTables(Array.isArray(data) ? data : []);
      } else {
        setTables([]);
      }
    } catch (err: any) {
      setErrorLog(prev => prev + '\nLoad Tables Error: ' + (err?.message || String(err)));
      setTables([]);
    }
  }, []);

  const loadMenu = useCallback(async () => {
    try {
      const res = await fetch('/api/menu?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const cats = await res.json();
        if (Array.isArray(cats)) {
          setCategories(cats);
          if (cats.length > 0) setActiveCategory(cats[0].id);
        } else {
          setCategories([]);
        }
      } else {
        setCategories([]);
      }
    } catch (err: any) {
      setErrorLog(prev => prev + '\nLoad Menu Error: ' + (err?.message || String(err)));
      setCategories([]);
    }
  }, []);

  const loadStaff = useCallback(async () => {
    try {
      const res = await fetch('/api/staff?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStaffList(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      setErrorLog(prev => prev + '\nLoad Staff Error: ' + (err?.message || String(err)));
    }
  }, []);

  const loadExistingOrder = useCallback(async (tableId: string) => {
    try {
      const res = await fetch('/api/orders?tableId=' + tableId + '&status=PENDING&t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const ordersData = await res.json();
        if (Array.isArray(ordersData)) {
          const consolidated: Record<string, { name: string; qty: number; price: number }> = {};
          ordersData.forEach((order: any) => {
            (order.items || []).forEach((item: any) => {
              if (item.isVoided) return;
              if (consolidated[item.menuItem]) {
                consolidated[item.menuItem].qty += item.qty;
              } else {
                consolidated[item.menuItem] = {
                  name: item.menuItem,
                  qty: item.qty,
                  price: item.price,
                };
              }
            });
          });
          setExistingOrderItems(Object.values(consolidated));
        } else {
          setExistingOrderItems([]);
        }
      } else {
        setExistingOrderItems([]);
      }
    } catch (err: any) {
      setExistingOrderItems([]);
    }
  }, []);

  useEffect(() => {
    loadTables();
    loadMenu();
    loadStaff();
    console.log('Waitstaff Page Freshly Loaded!');
    
    socketService.connect('rsk-restaurant-001');
    return () => {
      socketService.disconnect();
    };
  }, [loadTables, loadMenu, loadStaff]);

  useEffect(() => {
    if (screen !== 'tables') return;
    const interval = setInterval(() => {
      loadTables();
    }, 5000);
    return () => clearInterval(interval);
  }, [screen, loadTables]);

  /* ─── Cart helpers ──────────────────────────────────────── */
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const safePrev = (Array.isArray(prev) ? prev : []).filter(c => c && typeof c === 'object');
      const ex = safePrev.find(c => c.id === item.id);
      if (ex) return safePrev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...safePrev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const safePrev = (Array.isArray(prev) ? prev : []).filter(c => c && typeof c === 'object');
      const ex = safePrev.find(c => c.id === id);
      if (!ex) return safePrev;
      if (ex.qty === 1) return safePrev.filter(c => c.id !== id);
      return safePrev.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c);
    });
  };

  const safeCart = (Array.isArray(cart) ? cart : []).filter(c => c && typeof c === 'object');
  const cartCount = safeCart.reduce((s, c) => s + (c?.qty || 0), 0);
  const cartTotal = safeCart.reduce((s, c) => s + (c?.price || 0) * (c?.qty || 0), 0);

  /* ─── Send order ────────────────────────────────────────── */
  const sendOrder = async () => {
    if (!selectedTable || safeCart.length === 0) return;
    setSending(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTable.id,
          status: 'PENDING',
          items: safeCart.map(c => ({ name: c.name, price: c.price, qty: c.qty })),
        }),
      });
      if (res.ok) {
        const createdOrder = await res.json();

        // Construct socket order payload to sync with the main terminal
        const socketOrder = {
          id: createdOrder.id,
          tableId: selectedTable.id,
          items: safeCart.map(c => ({
            id: c.id,
            name: c.name,
            qty: c.qty,
            price: c.price,
            isNew: true,
            isVoided: false,
            addedBy: staffName || undefined,
          })),
          paymentMethod: null,
          openedAt: createdOrder.openedAt || new Date().toISOString(),
        };

        // Broadcast order update and table occupied status via WebSockets
        socketService.emit('SYNC_EVENT', {
          type: 'ORDER_UPDATE',
          payload: { tableId: selectedTable.id, order: socketOrder },
        });

        socketService.emit('SYNC_EVENT', {
          type: 'TABLE_STATUS_UPDATE',
          payload: { id: selectedTable.id, status: 'OCCUPIED' },
        });

        // Trigger voice and haptic KOT alerts on the cashier terminal
        socketService.emit('KOT_ALERT', {
          tableId: selectedTable.id,
          tableName: selectedTable.name,
        });

        setCart([]);
        setScreen('tables');
        setSelectedTable(null);
        setSearchQuery('');
        await loadTables();
        showToast('✅ Order sent to kitchen!');
      } else {
        showToast('❌ Failed to send order');
      }
    } catch {
      showToast('❌ Network error');
    }
    setSending(false);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleLogin = () => {
    const trimmed = staffName.trim();
    console.log('Start Shift Tap Received! name: ' + trimmed + ', staffList size: ' + staffList.length);
    if (!trimmed) {
      showToast('⚠️ Please enter your name');
      return;
    }

    if (staffList.length > 0) {
      const matched = staffList.find(
        s => s.name.toLowerCase() === trimmed.toLowerCase() && s.isActive
      );
      if (matched) {
        setStaffName(matched.name);
        setLoggedIn(true);
      } else {
        showToast('❌ Inactive or invalid staff member name');
      }
    } else {
      // Fallback in case list is empty or loading
      setStaffName(trimmed);
      setLoggedIn(true);
    }
  };

  /* ─── Staff login ───────────────────────────────────────── */
  if (!loggedIn) {
    return (
      <div style={{ ...styles.page, position: 'absolute', height: 'auto', minHeight: '100%', overflowY: 'auto' }}>
        {toast && <div style={styles.toast}>{toast}</div>}
        {errorLog && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: '#fee2e2',
            color: '#991b1b',
            padding: '12px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 99999,
            whiteSpace: 'pre-wrap',
            maxHeight: '150px',
            overflowY: 'auto',
            borderBottom: '2px solid #ef4444'
          }}>
            <strong>⚠️ Client Error:</strong>
            {errorLog}
            <button type="button" onClick={() => setErrorLog('')} style={{ float: 'right', background: 'none', border: 'none', color: '#991b1b', fontWeight: 'bold' }}>✕</button>
          </div>
        )}
        <div style={styles.loginCard}>
          <div style={styles.logo}>🍽️</div>
          <h1 style={styles.loginTitle}>RestroOS</h1>
          <p style={styles.loginSub}>Waitstaff Terminal</p>
          <input
            className="waitstaff-input"
            placeholder="Enter your name"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleLogin();
              }
            }}
          />
          <button
            type="button"
            className="waitstaff-btn"
            onClick={handleLogin}
          >
            Start Shift →
          </button>
          <div style={{ marginTop: 12, fontSize: 11, color: '#4b5563', letterSpacing: '0.05em' }}>
            v2.1 · Registered Staff: {staffList.length}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Table screen ──────────────────────────────────────── */
  if (screen === 'tables') {
    const safeTables = (Array.isArray(tables) ? tables : []).filter(t => t && typeof t === 'object');
    const sections = [...new Set(safeTables.map(t => t.section || 'General'))];
    return (
      <div style={styles.page}>
        {toast && <div style={styles.toast}>{toast}</div>}
        <div style={styles.header}>
          <div>
            <div style={styles.headerTitle}>Floor Map</div>
            <div style={styles.headerSub}>Hello, {staffName} 👋</div>
          </div>
          <button style={styles.refreshBtn} onClick={loadTables}>↻</button>
        </div>

        <div style={styles.scroll}>
          {sections.map(section => (
            <div key={section} style={styles.section}>
              <div style={styles.sectionLabel}>{section}</div>
              <div style={styles.tableGrid}>
                {safeTables.filter(t => (t.section || 'General') === section).map(t => {
                  const occupied = t.status === 'OCCUPIED';
                  return (
                    <button
                      key={t.id}
                      style={{ ...styles.tableCard, ...(occupied ? styles.tableOccupied : styles.tableVacant) }}
                      onClick={() => { setSelectedTable(t); loadExistingOrder(t.id); setScreen('menu'); }}
                    >
                      <div style={styles.tableName}>{t.name}</div>
                      <div style={styles.tableStatus}>{occupied ? '🔴 Occupied' : '🟢 Vacant'}</div>
                      <div style={styles.tableCap}>👥 {t.capacity}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {safeTables.length === 0 && (
            <div style={styles.empty}>No tables found.<br/>Set up tables from the main terminal.</div>
          )}
        </div>
      </div>
    );
  }

  /* ─── Menu screen ───────────────────────────────────────── */
  if (screen === 'menu') {
    const safeCategories = Array.isArray(categories) ? categories : [];
    const activeCat = safeCategories.find(c => c.id === activeCategory);
    
    // Filter items based on search query dynamically across all categories
    const displayedItems = searchQuery.trim()
      ? safeCategories.flatMap(c => c.items.map(i => ({ ...i, categoryName: c.name })))
          .filter(i => 
            i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (i.shortcutKey && String(i.shortcutKey).trim().toLowerCase().includes(searchQuery.trim().toLowerCase()))
          )
      : (activeCat?.items ?? []);

    return (
      <div style={styles.page}>
        {toast && <div style={styles.toast}>{toast}</div>}

        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.headerTitle}>{selectedTable?.name || 'Table'}</div>
            <div style={styles.headerSub}>{selectedTable?.section || ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={styles.cartBadgeBtn} onClick={() => setScreen('cart')}>
              🛒 {cartCount > 0 ? <span style={styles.badge}>{cartCount}</span> : null}
            </button>
            <button style={styles.backBtn} onClick={() => { setScreen('tables'); setCart([]); setSelectedTable(null); setSearchQuery(''); }}>✕</button>
          </div>
        </div>

        {/* Collapsible Already Ordered Items */}
        {existingOrderItems.length > 0 && (
          <div style={{ background: '#111', borderBottom: '1px solid #1a1a1a', padding: '10px 16px' }}>
            <details>
              <summary style={{ fontSize: 12, fontWeight: 700, color: '#10b981', cursor: 'pointer', outline: 'none', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📋 Active Table Order ({existingOrderItems.reduce((sum, i) => sum + i.qty, 0)} items)</span>
                <span style={{ fontSize: 10, color: '#6b7280' }}>Tap to view details ▼</span>
              </summary>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {existingOrderItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#9ca3af' }}>{item.name} <span style={{ color: '#10b981', fontWeight: 600 }}>x{item.qty}</span></span>
                    <span>₹{(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* Search Bar for Waitstaff Mobile Menu */}
        <div style={{ padding: '12px 16px 4px 16px', flexShrink: 0 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '14px', color: '#6b7280', fontSize: '14px' }}>🔍</span>
            <input
              type="text"
              placeholder="SEARCH BY ITEM OR SHORTCUT..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                borderRadius: '12px',
                border: '1px solid #262626',
                background: '#141414',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 'bold',
                outline: 'none',
                letterSpacing: '0.05em',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        {!searchQuery.trim() ? (
          <div style={styles.catRow}>
            {safeCategories.map(cat => (
              <button
                key={cat.id}
                style={{ ...styles.catTab, ...(activeCategory === cat.id ? styles.catTabActive : {}) }}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ padding: '8px 16px 2px 16px', fontSize: '11px', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.12em', flexShrink: 0 }}>
            🔍 Found {displayedItems.length} matching item{displayedItems.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Items */}
        <div style={styles.scroll}>
          <div style={styles.itemGrid}>
            {displayedItems.map(item => {
              const inCart = safeCart.find(c => c.id === item.id);
              return (
                <button
                  key={item.id}
                  style={{ ...styles.itemCard, ...(inCart ? styles.itemCardActive : {}) }}
                  onClick={() => addToCart(item)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={styles.itemName}>{item.name}</div>
                    {item.shortcutKey && (
                      <span style={{
                        fontSize: '8px',
                        fontWeight: 'bold',
                        background: '#262626',
                        color: '#10b981',
                        padding: '1.5px 4.5px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        flexShrink: 0
                      }}>
                        {item.shortcutKey}
                      </span>
                    )}
                  </div>
                  {item.description && <div style={styles.itemDesc}>{item.description}</div>}
                  <div style={styles.itemPrice}>₹{item.price.toFixed(2)}</div>
                  {inCart && <div style={styles.itemQtyBadge}>×{inCart.qty}</div>}
                </button>
              );
            })}
          </div>
          {displayedItems.length === 0 && (
            <div style={styles.empty}>No items found matching "{searchQuery}"</div>
          )}
        </div>

        {/* Cart footer */}
        {cartCount > 0 && (
          <button style={styles.cartFooter} onClick={() => setScreen('cart')}>
            <span>View Order ({cartCount} items)</span>
            <span>₹{cartTotal.toFixed(2)} →</span>
          </button>
        )}
      </div>
    );
  }

  /* ─── Cart screen ───────────────────────────────────────── */
  if (screen === 'cart') {
    return (
      <div style={styles.page}>
        {toast && <div style={styles.toast}>{toast}</div>}

        <div style={styles.header}>
          <div>
            <div style={styles.headerTitle}>Review Order</div>
            <div style={styles.headerSub}>{selectedTable?.name} · {selectedTable?.section}</div>
          </div>
          <button style={styles.backBtn} onClick={() => setScreen('menu')}>← Back</button>
        </div>

        <div style={styles.scroll}>
          {safeCart.map(item => (
            <div key={item.id} style={styles.cartRow}>
              <div style={styles.cartRowInfo}>
                <div style={styles.cartItemName}>{item.name}</div>
                <div style={styles.cartItemPrice}>₹{(item.price * item.qty).toFixed(2)}</div>
              </div>
              <div style={styles.qtyControls}>
                <button style={styles.qtyBtn} onClick={() => removeFromCart(item.id)}>−</button>
                <span style={styles.qtyNum}>{item.qty}</span>
                <button style={styles.qtyBtn} onClick={() => addToCart({ id: item.id, name: item.name, price: item.price })}>+</button>
              </div>
            </div>
          ))}

          {/* Existing Order Items Section */}
          {existingOrderItems.length > 0 && (
            <div style={{ marginTop: 24, borderTop: '1px dashed #262626', paddingTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
                Already Ordered (Sent to Kitchen)
              </div>
              {existingOrderItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 14 }}>
                  <span style={{ color: '#9ca3af' }}>{item.name} <span style={{ color: '#10b981', fontWeight: 'bold', marginLeft: 6 }}>x{item.qty}</span></span>
                  <span style={{ fontWeight: 600 }}>₹{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.cartSummary}>
          <div style={styles.totalRow}>
            <span style={{ color: '#9ca3af' }}>Total</span>
            <span style={styles.totalAmt}>₹{cartTotal.toFixed(2)}</span>
          </div>
          <button
            style={{ ...styles.sendBtn, opacity: sending ? 0.6 : 1 }}
            disabled={sending}
            onClick={sendOrder}
          >
            {sending ? 'Sending...' : '📤 Send to Kitchen'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

/* ─── Inline styles (no Tailwind needed, no SSR issues) ───── */
const styles: Record<string, React.CSSProperties> = {
  page:         { position:'fixed', top:0, left:0, right:0, bottom:0, display:'flex', flexDirection:'column', backgroundColor:'#0a0a0a', color:'#fff', fontFamily:'var(--font-inter, sans-serif)', overflowX:'hidden', overflowY:'hidden' },
  loginCard:    { margin:'auto', padding:'2rem', maxWidth:360, width:'90%', background:'#141414', borderRadius:24, border:'1px solid #262626', display:'flex', flexDirection:'column', gap:16, textAlign:'center' },
  logo:         { fontSize:48 },
  loginTitle:   { margin:0, fontSize:28, fontWeight:800, letterSpacing:'-0.05em' },
  loginSub:     { margin:0, fontSize:13, color:'#6b7280', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em' },
  input:        { padding:'14px 16px', borderRadius:14, border:'2px solid #262626', background:'#0a0a0a', color:'#fff', fontSize:16, outline:'none' },
  btn:          { padding:'14px 16px', borderRadius:14, background:'#10b981', color:'#000', fontSize:15, fontWeight:700, border:'none', cursor:'pointer', letterSpacing:'0.05em', touchAction:'manipulation', WebkitTapHighlightColor:'transparent' },
  header:       { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 16px 12px', borderBottom:'1px solid #1a1a1a', flexShrink:0 },
  headerTitle:  { fontSize:20, fontWeight:800, letterSpacing:'-0.03em' },
  headerSub:    { fontSize:12, color:'#6b7280', fontWeight:600 },
  refreshBtn:   { fontSize:20, background:'none', border:'none', color:'#6b7280', cursor:'pointer', padding:'8px', touchAction:'manipulation', WebkitTapHighlightColor:'transparent' },
  backBtn:      { background:'#1a1a1a', border:'none', color:'#9ca3af', borderRadius:10, padding:'8px 12px', fontSize:13, fontWeight:600, cursor:'pointer', touchAction:'manipulation', WebkitTapHighlightColor:'transparent' },
  cartBadgeBtn: { background:'#1a1a1a', border:'none', color:'#fff', borderRadius:10, padding:'8px 12px', fontSize:16, cursor:'pointer', position:'relative', touchAction:'manipulation', WebkitTapHighlightColor:'transparent' },
  badge:        { background:'#10b981', color:'#000', borderRadius:99, padding:'2px 7px', fontSize:11, fontWeight:800, marginLeft:4 },
  scroll:       { flex:1, overflowY:'auto', padding:'12px 16px' },
  section:      { marginBottom:24 },
  sectionLabel: { fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 },
  tableGrid:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  tableCard:    { padding:'16px', borderRadius:16, border:'2px solid transparent', textAlign:'left', cursor:'pointer', touchAction:'manipulation', WebkitTapHighlightColor:'transparent' },
  tableVacant:  { background:'#0f2e1a', borderColor:'#166534' },
  tableOccupied:{ background:'#2d1515', borderColor:'#991b1b' },
  tableName:    { fontSize:18, fontWeight:800, letterSpacing:'-0.02em' },
  tableStatus:  { fontSize:12, color:'#9ca3af', marginTop:4 },
  tableCap:     { fontSize:11, color:'#6b7280', marginTop:2 },
  empty:        { textAlign:'center', color:'#4b5563', padding:'60px 20px', lineHeight:1.8 },
  catRow:       { display:'flex', overflowX:'auto', gap:8, padding:'10px 16px', borderBottom:'1px solid #1a1a1a', flexShrink:0, scrollbarWidth:'none' },
  catTab:       { padding:'8px 16px', borderRadius:99, border:'1px solid #262626', background:'transparent', color:'#9ca3af', fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, touchAction:'manipulation', WebkitTapHighlightColor:'transparent' },
  catTabActive: { background:'#10b981', borderColor:'#10b981', color:'#000' },
  itemGrid:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, paddingBottom:80 },
  itemCard:     { padding:'14px', borderRadius:16, border:'2px solid #1a1a1a', background:'#111', textAlign:'left', cursor:'pointer', position:'relative', touchAction:'manipulation', WebkitTapHighlightColor:'transparent' },
  itemCardActive:{ borderColor:'#10b981', background:'#0f2e1a' },
  itemName:     { fontSize:14, fontWeight:700, lineHeight:1.3 },
  itemDesc:     { fontSize:11, color:'#6b7280', marginTop:4, lineHeight:1.4 },
  itemPrice:    { fontSize:15, fontWeight:800, color:'#10b981', marginTop:8 },
  itemQtyBadge: { position:'absolute', top:8, right:8, background:'#10b981', color:'#000', borderRadius:99, width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800 },
  cartFooter:   { position:'sticky', bottom:0, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', background:'#10b981', color:'#000', fontWeight:700, fontSize:15, border:'none', cursor:'pointer', flexShrink:0 },
  cartRow:      { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid #1a1a1a' },
  cartRowInfo:  { display:'flex', flexDirection:'column', gap:4 },
  cartItemName: { fontSize:15, fontWeight:700 },
  cartItemPrice:{ fontSize:13, color:'#10b981', fontWeight:600 },
  qtyControls:  { display:'flex', alignItems:'center', gap:12 },
  qtyBtn:       { width:32, height:32, borderRadius:99, background:'#1a1a1a', border:'none', color:'#fff', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', touchAction:'manipulation', WebkitTapHighlightColor:'transparent' },
  qtyNum:       { fontSize:16, fontWeight:700, minWidth:20, textAlign:'center' },
  cartSummary:  { borderTop:'1px solid #1a1a1a', padding:'16px 16px 24px', flexShrink:0 },
  totalRow:     { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  totalAmt:     { fontSize:22, fontWeight:800 },
  sendBtn:      { width:'100%', padding:'16px', background:'#10b981', color:'#000', border:'none', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', touchAction:'manipulation', WebkitTapHighlightColor:'transparent' },
  toast:        { position:'fixed', top:16, left:'50%', transform:'translateX(-50%)', background:'#1a1a1a', border:'1px solid #262626', color:'#fff', padding:'10px 20px', borderRadius:99, fontSize:13, fontWeight:600, zIndex:9999, whiteSpace:'nowrap' },
};
