import React from 'react';
import { AdminSidebar } from '../../src/components/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-black min-h-screen">
      <AdminSidebar />
      <main className="flex-1 ml-80 min-h-screen">
        {children}
      </main>
    </div>
  );
}
