'use client';

/**
 * Main Loom interface - The weaving chamber where timelines are crafted
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { useThreadweaverStore } from '@/lib/store/useThreadweaverStore';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { generateCustomCards } from '@/lib/utils/api';
import type { CompanyProfile } from '@/lib/types';
import LoomCanvas from '@/components/loom/LoomCanvas';
import ThreadPanel from '@/components/loom/ThreadPanel';
import ImpactPanel from '@/components/loom/ImpactPanel';
import ChronosControls from '@/components/ui/ChronosControls';
import DecisionModal from '@/components/ui/DecisionModal';
import CompareView from '@/components/ui/CompareView';
import NodeDetailsModal from '@/components/ui/NodeDetailsModal';
import CompanySetupModal from '@/components/ui/CompanySetupModal';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function LoomPage() {
  const { sessionId, companyProfile, uiState, setShowNodeDetails, setCompanyProfile, createSession, resetAllTimelines } = useThreadweaverStore();
  const { showDecisionModal, showCompareView, showNodeDetails } = uiState;
  const [showCompanySetup, setShowCompanySetup] = useState(false);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);

  // Initialize session if needed
  useEffect(() => {
    if (!sessionId) {
      // Show company setup modal on first load
      setShowCompanySetup(true);
    }
  }, [sessionId]);

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const handleCompanySetupComplete = async (profile: CompanyProfile) => {
    setCompanyProfile(profile);
    setShowCompanySetup(false);
    setIsGeneratingCards(true);

    try {
      // Generate custom cards based on company profile
      const response = await generateCustomCards({
        companyProfile: profile,
        numberOfCards: 10,
      });

      console.log(`Generated ${response.cards.length} custom cards for ${profile.companyName}`);

      // TODO: Store custom cards in state for use during gameplay
      // For now, cards will be generated on-demand by the backend

      // Create session with custom profile
      createSession(`${profile.industry} - ${profile.companyName}`, profile);

    } catch (error) {
      console.error('Failed to generate custom cards:', error);
      // Fallback to default scenario on error
      createSession(`${profile.industry} - ${profile.companyName}`, profile);
    } finally {
      setIsGeneratingCards(false);
    }
  };

  const handleSkipSetup = () => {
    createSession('Campus Dining / Restaurant Group');
    setShowCompanySetup(false);
  };

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
          <div className="container mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gold via-gold-light to-emerald bg-clip-text text-transparent">
                The Loom of Sustainable Futures
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Weave your timeline through sustainability decisions
              </p>
            </div>
            <div className="flex gap-3 items-center self-start sm:self-center">
              <Link
                href="/"
                className="btn-ghost text-sm shrink-0 flex items-center gap-2"
                aria-label="Go to home"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Delete all timelines and start with a fresh baseline? This cannot be undone.')) {
                    resetAllTimelines();
                  }
                }}
                className="btn-ghost text-sm shrink-0"
                aria-label="Reset all timelines"
              >
                Reset all timelines
              </button>
            </div>
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
      <CompanySetupModal
        isOpen={showCompanySetup}
        onComplete={handleCompanySetupComplete}
        onSkip={handleSkipSetup}
      />
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
