/**
 * useKeyboardShortcuts - Global keyboard navigation hook
 * Provides keyboard shortcuts for main app actions
 */

import { useEffect } from 'react';
import { useThreadweaverStore } from '@/lib/store/useThreadweaverStore';

export function useKeyboardShortcuts() {
  const {
    currentStep,
    jumpToStep,
    rewindToStep,
    setShowDecisionModal,
    setShowCompareView,
    toggleAutopilot,
  } = useThreadweaverStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Cmd/Ctrl + K: Open decision modal
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowDecisionModal(true);
      }

      // Cmd/Ctrl + Shift + C: Open compare view
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'c') {
        e.preventDefault();
        setShowCompareView(true);
      }

      // Cmd/Ctrl + Shift + A: Toggle autopilot
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'a') {
        e.preventDefault();
        toggleAutopilot();
      }

      // Arrow Right: Jump forward 1 step
      if (e.key === 'ArrowRight' && currentStep < 10) {
        e.preventDefault();
        jumpToStep(currentStep + 1);
      }

      // Arrow Left: Rewind 1 step
      if (e.key === 'ArrowLeft' && currentStep > 0) {
        e.preventDefault();
        rewindToStep(currentStep - 1);
      }

      // Cmd/Ctrl + ArrowRight: Jump to 12mo
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowRight') {
        e.preventDefault();
        jumpToStep(10);
      }

      // Cmd/Ctrl + ArrowLeft: Jump to start
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowLeft') {
        e.preventDefault();
        rewindToStep(0);
      }

      // Escape: Close modals
      if (e.key === 'Escape') {
        setShowDecisionModal(false);
        setShowCompareView(false);
      }

      // 1, 2, 3: Quick jump to steps
      if (e.key === '1') {
        e.preventDefault();
        jumpToStep(3);
      }
      if (e.key === '2') {
        e.preventDefault();
        jumpToStep(6);
      }
      if (e.key === '3') {
        e.preventDefault();
        jumpToStep(10);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    currentStep,
    jumpToStep,
    rewindToStep,
    setShowDecisionModal,
    setShowCompareView,
    toggleAutopilot,
  ]);
}

/**
 * Keyboard shortcuts reference for display
 */
export const KEYBOARD_SHORTCUTS = {
  'Cmd/Ctrl + K': 'Open decision modal',
  'Cmd/Ctrl + Shift + C': 'Compare timelines',
  'Cmd/Ctrl + Shift + A': 'Toggle autopilot',
  'Arrow Left/Right': 'Navigate timeline',
  'Cmd/Ctrl + Arrow': 'Jump to start/end',
  '1, 2, 3': 'Quick jump to 3mo/6mo/12mo',
  'Escape': 'Close modals',
};
