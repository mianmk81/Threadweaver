'use client';

/**
 * Main Loom interface - The weaving chamber where timelines are crafted
 */

import { useEffect } from 'react';
import { useThreadweaverStore } from '@/lib/store/useThreadweaverStore';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import LoomCanvas from '@/components/loom/LoomCanvas';
import ThreadPanel from '@/components/loom/ThreadPanel';
import ImpactPanel from '@/components/loom/ImpactPanel';
import ChronosControls from '@/components/ui/ChronosControls';
import DecisionModal from '@/components/ui/DecisionModal';
import CompareView from '@/components/ui/CompareView';
import NodeDetailsModal from '@/components/ui/NodeDetailsModal';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function LoomPage() {
  const { sessionId, uiState, setShowNodeDetails } = useThreadweaverStore();
  const { showDecisionModal, showCompareView, showNodeDetails } = uiState;

  // Initialize session if needed
  useEffect(() => {
    if (!sessionId) {
      useThreadweaverStore.getState().createSession('Campus Dining / Restaurant Group');
    }
  }, [sessionId]);

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-cosmic-slate via-cosmic-dark to-cosmic-darker relative overflow-hidden">
      {/* Cosmic background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main layout */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <header className="border-b border-gold/20 bg-cosmic-dark/80 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gold via-gold-light to-emerald bg-clip-text text-transparent">
              The Loom of Sustainable Futures
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Weave your timeline through sustainability decisions
            </p>
          </div>
        </header>

        {/* Main content: 2-column layout (responsive) */}
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 p-4 overflow-hidden">
          {/* Center: Loom Canvas - Full width on mobile, larger on desktop */}
          <div className="flex-1 lg:col-span-9 relative min-h-[400px]">
            <LoomCanvas />
          </div>

          {/* Right: Impact Panel - Below canvas on mobile, sidebar on desktop */}
          <div className="lg:col-span-3 overflow-y-auto max-h-[300px] lg:max-h-none">
            <ImpactPanel />
          </div>
        </div>

        {/* Bottom: Chronos Controls */}
        <div className="border-t border-gold/20 bg-cosmic-dark/80 backdrop-blur-sm">
          <ChronosControls />
        </div>
      </div>

      {/* Modals */}
      {showDecisionModal && <DecisionModal />}
      {showCompareView && <CompareView />}
      <NodeDetailsModal
        isOpen={showNodeDetails}
        onClose={() => setShowNodeDetails(false)}
      />
    </div>
    </ErrorBoundary>
  );
}
