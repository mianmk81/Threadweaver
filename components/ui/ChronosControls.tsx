'use client';

/**
 * ChronosControls - Bottom bar with time travel controls
 * Jump, Rewind, Reweave, and Autopilot toggle
 */

import { useState } from 'react';
import { useThreadweaverStore } from '@/lib/store/useThreadweaverStore';
import { simulateAutopilot } from '@/lib/utils/api';
import {
  FastForward,
  Rewind,
  GitBranch,
  Zap,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';

export default function ChronosControls() {
  const {
    currentStep,
    autopilotEnabled,
    jumpToStep,
    rewindToStep,
    toggleAutopilot,
    setShowDecisionModal,
    getCurrentMetrics,
    getActiveThread,
    addNode,
    activeThreadId,
  } = useThreadweaverStore();

  const [sliderValue, setSliderValue] = useState(currentStep);
  const [isRunningAutopilot, setIsRunningAutopilot] = useState(false);

  const activeThread = getActiveThread();

  const handleJump = (targetStep: number) => {
    jumpToStep(targetStep);
    setSliderValue(targetStep);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSliderValue(value);
  };

  const handleSliderRelease = () => {
    if (sliderValue !== currentStep) {
      if (sliderValue < currentStep) {
        rewindToStep(sliderValue);
      } else {
        jumpToStep(sliderValue);
      }
    }
  };

  const handleReweave = () => {
    // Reweave creates a new thread branching from current step
    setShowDecisionModal(true);
  };

  const handleAutopilot = async () => {
    if (isRunningAutopilot) return;

    // Calculate remaining steps
    const remainingSteps = 10 - (activeThread?.nodes.length || 0);

    if (remainingSteps <= 0) {
      alert("Timeline is already complete! No more decisions to make.");
      return;
    }

    setIsRunningAutopilot(true);

    try {
      const currentMetrics = getCurrentMetrics();

      console.log(`Running autopilot for ${remainingSteps} steps...`);

      const response = await simulateAutopilot({
        initialMetrics: currentMetrics,
        steps: remainingSteps,
      });

      // Add all simulated nodes to the current thread
      response.nodes.forEach((node) => {
        addNode(activeThreadId, node);
      });

      // Jump to the final step
      jumpToStep(10);
      setSliderValue(10);

      console.log('Autopilot simulation complete!');

      // Show success message with instructions
      setTimeout(() => {
        alert(
          '🎉 Autopilot Complete!\n\n' +
          'Your 12-month sustainability journey is now complete.\n\n' +
          '✨ What you can do:\n' +
          '• Click any green node to see what decision was made\n' +
          '• Click "Reweave from Here" to explore alternate paths\n' +
          '• Compare different timelines in the left panel\n\n' +
          'Your original timeline is preserved - explore freely!'
        );
      }, 500);
    } catch (error) {
      console.error('Autopilot failed:', error);
      alert(`Autopilot failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunningAutopilot(false);
    }
  };

  return (
    <div className="container mx-auto px-4 lg:px-6 py-3 lg:py-4">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-6">
        {/* Time position slider */}
        <div className="flex-1 order-1">
          <div className="flex items-center gap-2 lg:gap-4">
            <Clock className="w-5 h-5 text-gold" />
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Now</span>
                <span>3 months</span>
                <span>6 months</span>
                <span>12 months</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={sliderValue}
                onChange={handleSliderChange}
                onMouseUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                className="w-full h-2 bg-cosmic-slate rounded-lg appearance-none cursor-pointer slider-cosmic"
              />
              <div className="text-center mt-2">
                <span className="text-sm font-semibold text-gold">
                  Step {currentStep} / 10
                  <span className="text-gray-500 ml-2">
                    ({currentStep === 0 ? 'Now' : `${Math.round(currentStep * 1.2)} months`})
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick jump buttons */}
        <div className="flex gap-2 order-2 lg:order-2 overflow-x-auto">
          <button
            onClick={() => handleJump(3)}
            className="btn-ghost flex items-center gap-1 lg:gap-2 text-xs lg:text-sm whitespace-nowrap"
            disabled={currentStep >= 3}
            aria-label="Jump to 3 months"
          >
            <FastForward className="w-3 h-3 lg:w-4 lg:h-4" />
            <span className="hidden sm:inline">Jump</span> 3mo
          </button>
          <button
            onClick={() => handleJump(6)}
            className="btn-ghost flex items-center gap-1 lg:gap-2 text-xs lg:text-sm whitespace-nowrap"
            disabled={currentStep >= 6}
            aria-label="Jump to 6 months"
          >
            <FastForward className="w-3 h-3 lg:w-4 lg:h-4" />
            <span className="hidden sm:inline">Jump</span> 6mo
          </button>
          <button
            onClick={() => handleJump(10)}
            className="btn-ghost flex items-center gap-1 lg:gap-2 text-xs lg:text-sm whitespace-nowrap"
            disabled={currentStep >= 10}
            aria-label="Jump to 12 months"
          >
            <FastForward className="w-3 h-3 lg:w-4 lg:h-4" />
            <span className="hidden sm:inline">Jump</span> 12mo
          </button>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-10 bg-gold/20" />

        {/* Reweave button */}
        <button
          onClick={handleReweave}
          className="btn-secondary flex items-center justify-center gap-2 text-sm lg:text-base order-3"
          disabled={currentStep === 0}
          aria-label="Create new timeline branch"
        >
          <GitBranch className="w-4 h-4" />
          <span className="hidden sm:inline">Reweave</span>
        </button>

        {/* Autopilot button */}
        <button
          onClick={handleAutopilot}
          disabled={isRunningAutopilot || (activeThread?.nodes.length || 0) >= 10}
          className={`
            px-3 lg:px-4 py-2 rounded-lg font-semibold transition-all duration-300
            flex items-center justify-center gap-2 text-sm lg:text-base order-4
            ${isRunningAutopilot
              ? 'bg-gradient-to-r from-emerald to-emerald-light text-cosmic-dark shadow-glow-emerald'
              : (activeThread?.nodes.length || 0) >= 10
                ? 'bg-cosmic-slate/30 text-gray-500 cursor-not-allowed'
                : 'bg-cosmic-slate/50 text-gray-300 hover:bg-emerald/20 hover:text-emerald'
            }
          `}
          aria-label="Run autopilot simulation"
          title={
            (activeThread?.nodes.length || 0) >= 10
              ? 'Timeline complete'
              : `Simulate ${10 - (activeThread?.nodes.length || 0)} remaining decisions`
          }
        >
          {isRunningAutopilot ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Autopilot
            </>
          )}
        </button>
      </div>
    </div>
  );
}
