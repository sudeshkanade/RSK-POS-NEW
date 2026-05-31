'use client';

import React, { useEffect } from 'react';
import { usePOSStore } from '../../store/posStore';
import { socketService } from '../../services/socket.service';
import { syncService } from '../../services/sync.service.client';

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeUser } = usePOSStore();

  useEffect(() => {
    // Only start the background sync loop after a user logs in.
    // No point hammering the server on the login/onboarding screens.
    if (!activeUser) return;

    syncService.startSyncLoop();

    const handleSync = (e: any) => {
      const { type, payload } = e.detail;

      if (type === 'TABLE_STATUS_UPDATE') {
        usePOSStore.setState(state => ({
          tables: state.tables.map(t =>
            t.id === payload.id ? { ...t, status: payload.status } : t
          ),
        }));
      }

      if (type === 'ORDER_UPDATE') {
        usePOSStore.setState(state => ({
          orders: {
            ...state.orders,
            [payload.tableId]: payload.order,
          },
        }));
      }

      if (type === 'TABLE_LAYOUT_UPDATE') {
        usePOSStore.setState({ tables: payload.tables });
      }
    };

    window.addEventListener('SOCKET_SYNC', handleSync);
    return () => window.removeEventListener('SOCKET_SYNC', handleSync);
  }, [activeUser]); // Re-run when login state changes

  return <>{children}</>;
};
