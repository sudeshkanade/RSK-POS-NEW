import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { socketService } from '../services/socket.service';

// ─── Types ────────────────────────────────────────────────────────────────────
export type TableStatus = 'VACANT' | 'OCCUPIED' | 'BILL_PRINTED' | 'SETTLED' | 'PAYMENT_PENDING';
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | null;

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  isNew: boolean;
  isVoided: boolean;
  voidReason?: string;
  addedBy?: string;
  voidedBy?: string;
  categoryName?: string;
}

export interface TableOrder {
  id?: string;
  tableId: string;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  openedAt: string;
}

export interface Table {
  id: string;
  name: string;
  status: TableStatus;
  capacity: number;
  position: { x: number; y: number };
  section: string;
}

export interface SectionConfig {
  height: number;
  color: string;
}

export interface User {
  id: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'CASHIER';
}

// ─── Store ────────────────────────────────────────────────────────────────────
interface POSState {
  // Initialization
  isInitialized: boolean;
  fetchInitialData: () => Promise<void>;
  syncWithDb: () => Promise<void>;
  triggerDbSync: (tableId: string) => Promise<void>;

  // Tables
  tables: Table[];
  setTables: (tables: Table[]) => void;
  updateTableStatus: (id: string, status: TableStatus) => void;
  renameTable: (id: string, name: string) => void;
  moveTable: (id: string, position: { x: number; y: number }) => void;
  addTable: (section: string, name: string, capacity: number) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  saveLayoutToDb: () => Promise<void>;

  // Orders
  orders: Record<string, TableOrder>;
  getOrder: (tableId: string) => TableOrder;
  addItem: (tableId: string, item: Omit<OrderItem, 'isNew' | 'isVoided'>) => void;
  updateItemQty: (tableId: string, itemId: string, delta: number) => void;
  voidItem: (tableId: string, itemId: string, reason: string) => void;
  markKOTSent: (tableId: string) => void;
  setPaymentMethod: (tableId: string, method: PaymentMethod) => void;
  settleOrder: (tableId: string) => Promise<void>;
  transferOrder: (fromTableId: string, toTableId: string) => void;

  // Sections
  sections: string[];
  sectionConfig: Record<string, SectionConfig>;
  setSectionHeight: (section: string, height: number) => void;

  // UI
  selectedTableId: string | null;
  isPanelOpen: boolean;
  isEditMode: boolean;
  activeTab: 'floor' | 'inventory' | 'sales' | 'menu' | 'staff' | 'settings';
  setSelectedTable: (id: string | null) => void;
  setIsPanelOpen: (open: boolean) => void;
  setIsEditMode: (edit: boolean) => void;
  setActiveTab: (tab: POSState['activeTab']) => void;

  // Auth
  activeUser: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const SECTION_COLORS: Record<string, string> = {
  'Ground Floor': '#10b981',
  'First Floor':  '#f59e0b',
  'Outdoor':      '#0ea5e9',
};

const emptyOrder = (tableId: string): TableOrder => ({
  tableId, items: [], paymentMethod: null, openedAt: new Date().toISOString(),
});

const safeStorage = {
  getItem: (name: string) => {
    try {
      if (typeof window === 'undefined') return null;
      const str = window.localStorage.getItem(name);
      if (!str) return null;
      JSON.parse(str);
      return str;
    } catch (e) {
      console.warn('Corrupted or blocked localStorage found for', name, 'clearing...');
      try {
        if (typeof window !== 'undefined') window.localStorage.removeItem(name);
      } catch (err) {}
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(name, value);
    } catch (e) {}
  },
  removeItem: (name: string) => {
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(name);
    } catch (e) {}
  },
};

export const usePOSStore = create<POSState>()(
  persist(
    (set, get) => ({
      isInitialized: false,

      // ── API Hydration ──
      fetchInitialData: async () => {
        try {
          const res = await fetch('/api/tables');
          const data = await res.json();
          if (!Array.isArray(data)) return;

          const loadedTables: Table[] = data.map((t: any) => ({
            id: t.id,
            name: t.name,
            status: t.status,
            capacity: t.capacity,
            position: { x: t.posX, y: t.posY },
            section: t.section,
          }));

          const sections = Array.from(new Set(loadedTables.map(t => t.section)));
          const sectionConfig = { ...get().sectionConfig };
          sections.forEach(s => {
            if (!sectionConfig[s]) sectionConfig[s] = { height: 300, color: SECTION_COLORS[s] || '#888' };
          });

          // Fetch active pending orders from SQLite database and merge them
          const ordersRes = await fetch('/api/orders?status=PENDING');
          const ordersData = await ordersRes.json();
          const activeOrders: Record<string, TableOrder> = {};

          if (Array.isArray(ordersData)) {
            ordersData.forEach((order: any) => {
              const mappedItems = (order.items || []).map((i: any) => ({
                id: i.id,
                name: i.menuItem,
                qty: i.qty,
                price: i.price,
                isNew: false,
                isVoided: i.isVoided || false,
                voidReason: i.voidReason || undefined,
                addedBy: i.voidedById || undefined,
              }));

              const existing = activeOrders[order.tableId];
              if (existing) {
                mappedItems.forEach((newItem: any) => {
                  const match = existing.items.find((ei: any) => ei.name === newItem.name && !ei.isVoided);
                  if (match) {
                    match.qty += newItem.qty;
                  } else {
                    existing.items.push(newItem);
                  }
                });
              } else {
                activeOrders[order.tableId] = {
                  id: order.id,
                  tableId: order.tableId,
                  paymentMethod: order.paymentMethod || null,
                  openedAt: order.openedAt || new Date().toISOString(),
                  items: mappedItems,
                };
              }
            });
          }

          set({ 
            tables: loadedTables, 
            sections, 
            sectionConfig, 
            orders: { ...get().orders, ...activeOrders },
            isInitialized: true 
          });
        } catch (e) {
          console.error('Failed to load tables or active orders', e);
        }
      },

      syncWithDb: async () => {
        try {
          const res = await fetch('/api/tables');
          const tablesData = await res.json();
          if (!Array.isArray(tablesData)) return;

          // 1. Sync table statuses
          set(state => {
            const updatedTables = state.tables.map(t => {
              const dbTable = tablesData.find((dt: any) => dt.id === t.id);
              if (!dbTable) return t;
              return {
                ...t,
                status: dbTable.status,
                capacity: dbTable.capacity,
                name: dbTable.name,
                ...(state.isEditMode ? {} : { position: { x: dbTable.posX, y: dbTable.posY } })
              };
            });
            return { tables: updatedTables };
          });

          // 2. Fetch pending orders from DB
          const ordersRes = await fetch('/api/orders?status=PENDING');
          const dbOrders = await ordersRes.json();
          if (!Array.isArray(dbOrders)) return;

          // Group DB orders by tableId
          const dbOrdersByTable: Record<string, any[]> = {};
          dbOrders.forEach((o: any) => {
            if (!dbOrdersByTable[o.tableId]) dbOrdersByTable[o.tableId] = [];
            dbOrdersByTable[o.tableId].push(o);
          });

          let newOrdersAlert: string[] = [];

          set(state => {
            const updatedOrders = { ...state.orders };

            Object.entries(dbOrdersByTable).forEach(([tableId, ordersList]) => {
              const dbItems: any[] = [];
              let openedAt = new Date().toISOString();
              let orderId: string | undefined = undefined;

              ordersList.forEach(o => {
                orderId = o.id;
                openedAt = o.openedAt || openedAt;
                (o.items || []).forEach((i: any) => {
                  if (i.isVoided) return;
                  const existing = dbItems.find(x => x.name === i.menuItem);
                  if (existing) {
                    existing.qty += i.qty;
                  } else {
                    dbItems.push({
                      id: i.id,
                      name: i.menuItem,
                      qty: i.qty,
                      price: i.price,
                      isNew: false,
                      isVoided: false,
                    });
                  }
                });
              });

              const localOrder = updatedOrders[tableId];
              if (!localOrder) {
                // New order received!
                const tableName = state.tables.find(t => t.id === tableId)?.name || tableId;
                newOrdersAlert.push(tableName);
                
                updatedOrders[tableId] = {
                  id: orderId,
                  tableId,
                  paymentMethod: null,
                  openedAt,
                  items: dbItems,
                };
              } else {
                // Merge: Keep local items (isNew === true) and replace sent items (isNew === false) with DB items
                const localNewItems = localOrder.items.filter(i => i.isNew && !i.isVoided);
                const localVoidedItems = localOrder.items.filter(i => i.isVoided);
                
                const mergedItems = [...dbItems];
                localNewItems.forEach(ln => {
                  mergedItems.push(ln);
                });
                mergedItems.push(...localVoidedItems);

                const dbTotalQty = dbItems.reduce((sum, i) => sum + i.qty, 0);
                const localSentTotalQty = localOrder.items.filter(i => !i.isNew && !i.isVoided).reduce((sum, i) => sum + i.qty, 0);
                if (dbTotalQty > localSentTotalQty && localOrder.id === orderId) {
                  const tableName = state.tables.find(t => t.id === tableId)?.name || tableId;
                  newOrdersAlert.push(tableName + " updated");
                }

                updatedOrders[tableId] = {
                  ...localOrder,
                  id: orderId || localOrder.id,
                  items: mergedItems,
                };
              }
            });

            // Vacant tables in DB cleanup
            Object.keys(updatedOrders).forEach(tableId => {
              if (!dbOrdersByTable[tableId]) {
                const localOrder = updatedOrders[tableId];
                if (localOrder) {
                  const hasUnsavedItems = localOrder.items.some(i => i.isNew && !i.isVoided);
                  if (!hasUnsavedItems) {
                    delete updatedOrders[tableId];
                  }
                }
              }
            });

            return { orders: updatedOrders };
          });

          // Play speech synthesizer alert
          if (newOrdersAlert.length > 0) {
            newOrdersAlert.forEach(alertText => {
              try {
                if (typeof window !== 'undefined' && window.speechSynthesis) {
                  const utterance = new SpeechSynthesisUtterance(`New order: ${alertText}`);
                  window.speechSynthesis.speak(utterance);
                }
              } catch (err) {
                console.error('SpeechSynthesis error:', err);
              }
            });
          }
        } catch (e) {
          console.error('Local db polling sync failed:', e);
        }
      },

      triggerDbSync: async (tableId: string) => {
        const order = get().orders[tableId];
        if (!order) return;
        try {
          await fetch('/api/orders/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tableId,
              items: order.items,
            }),
          });
        } catch (e) {
          console.error('Failed to trigger database sync for table', tableId, e);
        }
      },

      saveLayoutToDb: async () => {
        const { tables } = get();
        await Promise.all(tables.map(t => 
          fetch(`/api/tables/${t.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ posX: t.position.x, posY: t.position.y, section: t.section }),
          }).catch(e => console.error(e))
        ));
      },

      // ── Tables ──
      tables: [],
      setTables: (tables) => set({ tables }),

      updateTableStatus: (id, status) => {
        set(s => ({ tables: s.tables.map(t => t.id === id ? { ...t, status } : t) }));
        socketService.emit('SYNC_EVENT', { type: 'TABLE_STATUS_UPDATE', payload: { id, status } });
        fetch(`/api/tables/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }).catch(e => console.error(e));
      },

      renameTable: (id, name) => {
        set(s => ({ tables: s.tables.map(t => t.id === id ? { ...t, name } : t) }));
        socketService.emit('SYNC_EVENT', { type: 'TABLE_LAYOUT_UPDATE', payload: { tables: get().tables } });
        fetch(`/api/tables/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        }).catch(e => console.error(e));
      },

      moveTable: (id, position) => {
        set(s => ({ tables: s.tables.map(t => t.id === id ? { ...t, position } : t) }));
        socketService.emit('SYNC_EVENT', { type: 'TABLE_LAYOUT_UPDATE', payload: { tables: get().tables } });
      },

      addTable: async (section, name, capacity) => {
        const res = await fetch('/api/tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, section, capacity, posX: 50, posY: 50 }),
        });
        const t = await res.json();
        set(s => ({
          tables: [...s.tables, {
            id: t.id, name: t.name, status: t.status, capacity: t.capacity,
            position: { x: t.posX, y: t.posY }, section: t.section,
          }],
          isEditMode: true,
        }));
        socketService.emit('SYNC_EVENT', { type: 'TABLE_LAYOUT_UPDATE', payload: { tables: get().tables } });
      },

      deleteTable: async (id) => {
        try {
          await fetch(`/api/tables/${id}`, { method: 'DELETE' });
          set(s => ({
            tables: s.tables.filter(t => t.id !== id),
            selectedTableId: s.selectedTableId === id ? null : s.selectedTableId,
            isPanelOpen: s.selectedTableId === id ? false : s.isPanelOpen,
          }));
          socketService.emit('SYNC_EVENT', { type: 'TABLE_LAYOUT_UPDATE', payload: { tables: get().tables } });
        } catch (e) {
          console.error('Failed to delete table', e);
        }
      },

      // ── Orders ──
      orders: {},

      getOrder: (tableId) => get().orders[tableId] ?? emptyOrder(tableId),

      addItem: (tableId, mi) => {
        set(s => {
          const order = s.orders[tableId] ?? emptyOrder(tableId);
          const exists = order.items.find(i => i.name === mi.name && !i.isVoided);
          const items = exists
            ? order.items.map(i => i.name === mi.name && !i.isVoided ? { ...i, qty: i.qty + 1, isNew: true, addedBy: get().activeUser?.name } : i)
            : [...order.items, { ...mi, isNew: true, isVoided: false, addedBy: get().activeUser?.name }];

          const table = s.tables.find(t => t.id === tableId);
          // Only update status + persist if table was VACANT (avoid redundant API calls)
          if (table?.status === 'VACANT') get().updateTableStatus(tableId, 'OCCUPIED');

          const updatedOrders = { ...s.orders, [tableId]: { ...order, items } };
          socketService.emit('SYNC_EVENT', { type: 'ORDER_UPDATE', payload: { tableId, order: updatedOrders[tableId] } });
          return { orders: updatedOrders };
        });
        get().triggerDbSync(tableId);
      },

      updateItemQty: (tableId, itemId, delta) => {
        set(s => {
          const order = s.orders[tableId] ?? emptyOrder(tableId);
          const items = order.items.map(i => {
            if (i.id !== itemId) return i;
            const newQty = Math.max(0, i.qty + delta);
            return { ...i, qty: newQty, isNew: delta > 0 ? true : i.isNew };
          }).filter(i => i.qty > 0 || i.isVoided);

          const updatedOrders = { ...s.orders, [tableId]: { ...order, items } };
          socketService.emit('SYNC_EVENT', { type: 'ORDER_UPDATE', payload: { tableId, order: updatedOrders[tableId] } });
          return { orders: updatedOrders };
        });
        get().triggerDbSync(tableId);
      },

      voidItem: (tableId, itemId, reason) => {
        set(s => {
          const order = s.orders[tableId] ?? emptyOrder(tableId);
          const items = order.items.map(i =>
            i.id === itemId ? { ...i, isVoided: true, voidReason: reason, voidedBy: get().activeUser?.name } : i
          );
          const updatedOrders = { ...s.orders, [tableId]: { ...order, items } };
          socketService.emit('SYNC_EVENT', { type: 'ORDER_UPDATE', payload: { tableId, order: updatedOrders[tableId] } });
          return { orders: updatedOrders };
        });
        get().triggerDbSync(tableId);
      },

      markKOTSent: (tableId) => {
        set(s => {
          const order = s.orders[tableId] ?? emptyOrder(tableId);
          const items = order.items.map(i => ({ ...i, isNew: false }));
          const updatedOrders = { ...s.orders, [tableId]: { ...order, items } };
          socketService.emit('SYNC_EVENT', { type: 'ORDER_UPDATE', payload: { tableId, order: updatedOrders[tableId] } });
          
          // Also alert kitchen via socket
          socketService.emit('KOT_ALERT', { tableId, tableName: s.tables.find(t => t.id === tableId)?.name });

          return { orders: updatedOrders };
        });
        get().triggerDbSync(tableId);
      },

      setPaymentMethod: (tableId, method) => set(s => {
        const order = s.orders[tableId] ?? emptyOrder(tableId);
        return { orders: { ...s.orders, [tableId]: { ...order, paymentMethod: method } } };
      }),

      settleOrder: async (tableId) => {
        const order = get().orders[tableId];
        if (!order) return;

        try {
          await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tableId,
              items: order.items,
              paymentMethod: order.paymentMethod,
              status: 'SETTLED',
              settledBy: get().activeUser?.id,
            }),
          });
          get().updateTableStatus(tableId, 'VACANT');
          set(s => {
            const { [tableId]: _, ...rest } = s.orders;
            return { orders: rest };
          });
        } catch (e) {
          console.error('Failed to settle order to DB', e);
        }
      },

      transferOrder: (fromTableId, toTableId) => {
        set(s => {
          const fromOrder = s.orders[fromTableId];
          if (!fromOrder || fromOrder.items.length === 0) return s;

          const toOrder = s.orders[toTableId] ?? emptyOrder(toTableId);
          
          // Merge items
          const newItems = [...toOrder.items];
          fromOrder.items.forEach(fromItem => {
            if (fromItem.isVoided) {
              newItems.push({ ...fromItem, id: crypto.randomUUID() });
              return;
            }
            const existing = newItems.find(i => i.name === fromItem.name && !i.isVoided);
            if (existing) {
              existing.qty += fromItem.qty;
            } else {
              newItems.push({ ...fromItem, id: crypto.randomUUID() });
            }
          });

          const updatedToOrder = { ...toOrder, items: newItems };
          
          const { [fromTableId]: _, ...remainingOrders } = s.orders;
          const updatedOrders = { ...remainingOrders, [toTableId]: updatedToOrder };

          // Update table statuses
          const fromTable = s.tables.find(t => t.id === fromTableId);
          const toTable = s.tables.find(t => t.id === toTableId);

          if (fromTable?.status !== 'VACANT') {
            get().updateTableStatus(fromTableId, 'VACANT');
          }
          if (toTable?.status === 'VACANT') {
            get().updateTableStatus(toTableId, 'OCCUPIED');
          }

          socketService.emit('SYNC_EVENT', { type: 'ORDER_UPDATE', payload: { tableId: toTableId, order: updatedToOrder } });
          socketService.emit('SYNC_EVENT', { type: 'ORDER_UPDATE', payload: { tableId: fromTableId, order: null } });

          return { orders: updatedOrders };
        });
        get().triggerDbSync(fromTableId);
        get().triggerDbSync(toTableId);
      },

      // ── Sections ──
      sections: [],
      sectionConfig: {},

      setSectionHeight: (section, height) => set(s => ({
        sectionConfig: {
          ...s.sectionConfig,
          [section]: { ...s.sectionConfig[section], height: Math.max(220, Math.min(800, height)) },
        },
      })),

      // ── UI ──
      selectedTableId: null,
      isPanelOpen: false,
      isEditMode: false,
      activeTab: 'floor',

      setSelectedTable: (id) => set({ selectedTableId: id, isPanelOpen: id !== null }),
      setIsPanelOpen: (open) => set({ isPanelOpen: open }),
      setIsEditMode: (edit) => {
        if (!edit && get().isEditMode) get().saveLayoutToDb(); // Save on toggle off
        set({ isEditMode: edit });
      },
      setActiveTab: (tab) => set({ activeTab: tab }),

      // ── Auth ──
      activeUser: null,
      login: (user) => set({ activeUser: user, activeTab: 'floor' }),
      // isInitialized must be reset on logout so fetchInitialData() re-runs on next login
      logout: () => set({ activeUser: null, activeTab: 'floor', selectedTableId: null, isPanelOpen: false, isInitialized: false }),
    }),
    {
      name: 'restro-os-pos-state',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        orders: s.orders,
        sectionConfig: s.sectionConfig,
      }),
    }
  )
);

// ─── Selectors ─────────────────────────────────────────────────────────────
export const useTable = (id: string) => usePOSStore(s => s.tables.find(t => t.id === id));

export const useOrderTotal = (tableId: string) =>
  usePOSStore(s => {
    const order = s.orders[tableId];
    if (!order) return 0;
    return order.items.filter(i => !i.isVoided).reduce((sum, i) => sum + i.price * i.qty, 0);
  });
