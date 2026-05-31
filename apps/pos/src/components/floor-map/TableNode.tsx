import React, { useState } from 'react';
import { usePOSStore } from '../../store/posStore';

type TableStatus = 'VACANT' | 'OCCUPIED' | 'BILL_PRINTED' | 'SETTLED' | 'PAYMENT_PENDING';

interface TableNodeProps {
  id: string;
  name: string;
  status: TableStatus;
  capacity: number;
  totalAmount?: number;
  openedAt?: string;
  onClick: (id: string) => void;
  isEditMode?: boolean;
}

const STATUS_STYLE: Record<TableStatus, { bg: string; border: string; dot: string; glow: string }> = {
  VACANT:          { bg: 'rgba(16,185,129,0.06)',  border: 'rgba(16,185,129,0.25)', dot: '#10b981', glow: 'rgba(16,185,129,0.1)' },
  OCCUPIED:        { bg: 'rgba(245,158,11,0.06)',   border: 'rgba(245,158,11,0.25)', dot: '#f59e0b', glow: 'rgba(245,158,11,0.1)' },
  BILL_PRINTED:    { bg: 'rgba(244,63,94,0.06)',    border: 'rgba(244,63,94,0.25)', dot: '#f43f5e', glow: 'rgba(244,63,94,0.1)' },
  SETTLED:         { bg: 'rgba(14,165,233,0.06)',   border: 'rgba(14,165,233,0.25)', dot: '#0ea5e9', glow: 'rgba(14,165,233,0.1)' },
  PAYMENT_PENDING: { bg: 'rgba(168,85,247,0.06)',   border: 'rgba(168,85,247,0.25)', dot: '#a855f7', glow: 'rgba(168,85,247,0.1)' },
};

export const TableNode: React.FC<TableNodeProps> = ({ id, name, status, capacity, totalAmount, openedAt, onClick, isEditMode }) => {
  const [showQR, setShowQR] = useState(false);
  const deleteTable = usePOSStore(s => s.deleteTable);
  const [elapsed, setElapsed] = useState<string>('');
  const s = STATUS_STYLE[status];

  React.useEffect(() => {
    if (status === 'VACANT' || !openedAt) {
      setElapsed('');
      return;
    }
    const update = () => {
      const ms = Date.now() - new Date(openedAt).getTime();
      const mins = Math.floor(ms / 60000);
      const hrs = Math.floor(mins / 60);
      if (hrs > 0) setElapsed(`${hrs}h ${mins % 60}m`);
      else setElapsed(`${mins}m`);
    };
    update(); // Run immediately so display is never stale on mount
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [status, openedAt]);

  return (
    <>
      <div
        onClick={() => onClick(id)}
        onContextMenu={(e) => { e.preventDefault(); setShowQR(true); }}
        title="Click to open order · Right-click for QR"
        style={{ 
          backgroundColor: s.bg, 
          border: `1px solid ${s.border}`, 
          color: 'var(--text-primary)',
          boxShadow: `0 20px 40px -10px ${s.glow}, 0 4px 10px -2px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.1)`
        }}
        className={`w-32 h-32 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-500 hover:scale-[1.03] active:scale-95 group relative overflow-hidden ${status === 'OCCUPIED' ? 'animate-subtle-glow' : ''}`}
      >
        <div className="absolute inset-0 bg-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Delete button (Edit Mode only) */}
        {isEditMode && (
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              if (window.confirm(`Are you sure you want to delete ${name}?`)) {
                deleteTable(id);
              }
            }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center text-white text-[10px] font-bold z-30 transition-colors shadow-lg"
            title="Delete Table"
          >
            ✕
          </button>
        )}

        {/* Status dot */}
        <div style={{ backgroundColor: s.dot }} className="w-1 h-1 rounded-full mb-2 shadow-[0_0_10px_currentColor]" />

        {/* Status text & Timer */}
        <span className="text-[7px] font-bold uppercase tracking-[0.2em] mb-1 text-zinc-500">
          {status.split('_').join(' ')} {elapsed && `· ${elapsed}`}
        </span>

        {/* Table name */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-3xl font-bold tracking-tighter leading-none text-white">
            {name}
          </span>
        </div>

        {/* Amount (only when active) */}
        {totalAmount && totalAmount > 0 && (status === 'OCCUPIED' || status === 'BILL_PRINTED' || status === 'PAYMENT_PENDING') && (
          <span className="text-[10px] font-bold text-emerald-500/80">₹{totalAmount}</span>
        )}

        {/* Capacity */}
        <div className="mt-2 px-3 py-1 rounded-full text-[7px] font-bold tracking-widest uppercase border border-white/5 bg-black/20 text-zinc-600">
          Pax {capacity}
        </div>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}
          onClick={() => setShowQR(false)}
        >
          <div
            style={{ backgroundColor: 'var(--surface-color)' }}
            className="p-10 rounded-3xl flex flex-col items-center max-w-xs w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <p style={{ color: 'var(--text-secondary)' }} className="text-[10px] font-bold uppercase tracking-widest mb-3">Customer Menu QR</p>
            <h3 className="text-4xl font-bold tracking-tighter uppercase mb-8">{name}</h3>

            {/* Live QR from public API */}
            <div className="w-56 h-56 bg-white p-4 rounded-2xl mb-8 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://restro.rsk.solutions/menu/table/${id}`)}`}
                alt={`QR for ${name}`}
                className="w-full h-full"
              />
            </div>

            <p style={{ color: 'var(--text-secondary)' }} className="text-[10px] font-bold text-center mb-6 uppercase tracking-wider">
              Scan to view menu & track order
            </p>

            <button
              onClick={() => setShowQR(false)}
              className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-bold uppercase tracking-widest text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
