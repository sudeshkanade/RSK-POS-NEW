'use client';

import React, { useState, useEffect } from 'react';

interface WalkthroughProps {
  onClose: () => void;
  isOpen: boolean;
}

interface TourStep {
  title: string;
  badge: string;
  description: string;
  icon: string;
  highlightClass?: string; // CSS selector of element to highlight
  positionNotes: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to RestroOS',
    badge: 'START TOUR',
    description: 'Welcome! Your Connected SaaS POS terminal is fully configured. Let\'s take a quick 1-minute tour to help you get started with the main cashier functions.',
    icon: '🚀',
    positionNotes: 'Centered welcome introduction'
  },
  {
    title: 'Interactive Floor Map',
    badge: 'STEP 1: TABLE MAP',
    description: 'The table layout updates in real-time. Tables are color-coded by state: Green is Vacant, Orange is Occupied, Red is Billed, and Purple is Payment Pending. Tap any table to inspect details.',
    icon: '📍',
    highlightClass: '.floor-map-canvas',
    positionNotes: 'Spotlight highlighting the table canvas area'
  },
  {
    title: 'Instant Table Ordering',
    badge: 'STEP 2: ITEM BILLING',
    description: 'Tap any table to open the Order Panel on the right. You can select menu items, update quantities, void items, send Kitchen Order Tickets (KOT) directly to cooks, and process final bills.',
    icon: '📝',
    highlightClass: '.order-panel-container',
    positionNotes: 'Spotlight highlighting the right sidebar order panel'
  },
  {
    title: 'Drag & Drop Customization',
    badge: 'STEP 3: MAP EDITOR',
    description: 'Toggle "Edit Map" in the header to unlock drag-and-drop table layouts. Managers can rearrange tables, add new tables to any floor section, and resize canvas heights dynamically.',
    icon: '⚙️',
    highlightClass: '.edit-map-btn',
    positionNotes: 'Spotlight highlighting the Edit Map button in the header'
  },
  {
    title: 'Connect Waitstaff Mobile (PWA)',
    badge: 'STEP 4: WIRELESS ORDERING',
    description: 'Waitstaff can take orders right at the tables! Connect any phone or tablet to the same local Wi-Fi, open the browser to http://{{IP_ADDRESS}}:3002, and tap "Add to Home Screen" to install the native standalone PWA interface instantly.',
    icon: '📱',
    positionNotes: 'Spotlight on local Spoke Wi-Fi connections and mobile PWA installations'
  },
  {
    title: '30-Day Free Trial Active',
    badge: 'STEP 5: SUBSCRIPTION',
    description: 'You are currently running on a fully unlocked 30-Day Trial. Your remaining days are shown in the top badge. To upgrade to a permanent enterprise version, enter a license key in settings.',
    icon: '💎',
    highlightClass: '.trial-info-badge',
    positionNotes: 'Spotlight highlighting the trial status indicator'
  }
];

export const Walkthrough: React.FC<WalkthroughProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [activeHighlight, setActiveHighlight] = useState<DOMRect | null>(null);
  const [hostIp, setHostIp] = useState('192.168.1.XX');

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
    if (!isOpen) return;

    const step = TOUR_STEPS[currentStep];
    if (step.highlightClass) {
      const element = document.querySelector(step.highlightClass);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a temporary subtle flash/border effect to the element to highlight it
        element.classList.add('ring-4', 'ring-emerald-500', 'ring-offset-2', 'ring-offset-black', 'transition-all', 'duration-500');
        
        const rect = element.getBoundingClientRect();
        setActiveHighlight(rect);

        return () => {
          element.classList.remove('ring-4', 'ring-emerald-500', 'ring-offset-2', 'ring-offset-black');
        };
      }
    }
    setActiveHighlight(null);
  }, [currentStep, isOpen]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      localStorage.setItem('rsk_walkthrough_completed', 'true');
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center font-sans overflow-hidden">
      {/* Dimmed Background Overlay */}
      <div 
        className="absolute inset-0 bg-black/65 backdrop-blur-[3px] transition-opacity duration-500" 
        onClick={onClose}
      />

      {/* Dynamic Spotlight Effect */}
      {activeHighlight && (
        <div 
          className="absolute border border-emerald-500/50 rounded-2xl pointer-events-none shadow-[0_0_80px_rgba(16,185,129,0.3)] transition-all duration-300 z-[10000]"
          style={{
            top: activeHighlight.top - 8,
            left: activeHighlight.left - 8,
            width: activeHighlight.width + 16,
            height: activeHighlight.height + 16,
          }}
        />
      )}

      {/* Main Walkthrough Card */}
      <div 
        className="relative w-full max-w-xl mx-4 rounded-xl bg-[#0c0c0e] border border-zinc-800 shadow-2xl p-8 md:p-10 flex flex-col z-[10001] animate-in fade-in zoom-in duration-300"
        style={{
          boxShadow: '0 25px 70px -10px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.05)'
        }}
      >
        {/* Glow Effects */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Indicator */}
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="bg-emerald-500/10 border border-emerald-500/25 px-4 py-1.5 rounded-full">
            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">
              {step.badge}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest"
          >
            ✕ Skip Tour
          </button>
        </div>

        {/* Content Slide */}
        <div className="flex flex-col items-center text-center flex-1 relative z-10 mb-8">
          <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-inner animate-bounce">
            {step.icon}
          </div>
          <h2 className="text-3xl font-bold tracking-tighter uppercase mb-4 text-white">
            {step.title}
          </h2>
          <p className="text-zinc-400 font-medium text-sm leading-relaxed max-w-md">
            {step.description.replace('{{IP_ADDRESS}}', hostIp)}
          </p>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between mt-auto border-t border-zinc-900 pt-6 relative z-10">
          {/* Progress Indicators */}
          <div className="flex gap-2">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'w-8 bg-emerald-500' : 'w-2.5 bg-zinc-800 hover:bg-zinc-700'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-6 py-3.5 bg-zinc-900 text-zinc-300 rounded-xl font-bold uppercase tracking-widest text-[10px] border border-zinc-800 hover:text-white transition-all active:scale-95"
              >
                ◀ Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-6 py-3.5 bg-emerald-500 text-black rounded-xl font-bold uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
            >
              {currentStep === TOUR_STEPS.length - 1 ? '✓ Complete' : 'Next ▶'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
