'use client';

import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { FloorMap } from '../components/floor-map/FloorMap';
import { Login } from '../components/auth/Login';
import { Onboarding } from '../components/auth/Onboarding';
import { usePOSStore } from '../store/posStore';
import { socketService } from '../services/socket.service';

export default function Home() {
  const { activeUser, login } = usePOSStore();

  // Check if this is a fresh install (no trial/license started yet).
  // LicenseGuard in layout.tsx already blocks EXPIRED users,
  // so here we just determine if the user has gone through first-time setup.
  // Lazy initializer: mobile/LAN clients (non-localhost) are always onboarded — 
  // the server itself holds the license. Start as true immediately, no spinner.
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hostname;
      if (h && h !== 'localhost' && h !== '127.0.0.1') return true;
    }
    return null; // localhost: resolve via fetch below
  });

  useEffect(() => {
    // Mobile/LAN already handled by lazy initializer — skip fetch
    if (isOnboarded !== null) return;

    fetch('/api/license')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ACTIVE' || data.status === 'TRIAL') {
          setIsOnboarded(true);
        } else {
          setIsOnboarded(false);
        }
      })
      .catch(() => {
        setIsOnboarded(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Connect socket once user is logged in
  useEffect(() => {
    if (activeUser) {
      fetch('/api/license')
        .then(r => r.json())
        .then(data => {
          if (data.restaurantId) socketService.connect(data.restaurantId);
        })
        .catch(() => {
          socketService.connect('rsk-restaurant-001');
        });
    }
  }, [activeUser]);

  if (isOnboarded === null) {
    return (
      <div className="h-full w-full bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isOnboarded) {
    return <Onboarding onActivate={() => setIsOnboarded(true)} />;
  }

  if (!activeUser) {
    return <Login onLogin={login} />;
  }

  return (
    <ErrorBoundary label="Floor Map">
      <FloorMap />
    </ErrorBoundary>
  );
}
