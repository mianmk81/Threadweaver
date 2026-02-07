'use client';

/**
 * ThreadPanel - Left sidebar showing all timeline threads
 * Allows switching between alternate timelines
 */

import { useState, useEffect } from 'react';
import { useThreadweaverStore } from '@/lib/store/useThreadweaverStore';
import { Sparkles, GitBranch, Trash2 } from 'lucide-react';

export default function ThreadPanel() {
  const [mounted, setMounted] = useState(false);
  const {
    threads,
    activeThreadId,
    setActiveThread,
    deleteThread,
    createThread,
  } = useThreadweaverStore();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreateThread = () => {
    const nextLabel = String.fromCharCode(65 + threads.length); // A, B, C, etc.
    const colors = ['gold', 'emerald', 'cyan', 'purple', 'rose'];
    const color = colors[threads.length % colors.length];

    createThread(`Thread ${nextLabel}`, color);
  };

  const handleDeleteThread = (threadId: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();

    if (threads.length <= 1) {
      return; // Can't delete the last thread
    }

    const thread = threads.find(t => t.id === threadId);
    const confirmMessage = `Delete "${thread?.label}"? This will permanently remove this timeline and all its decisions.`;

    if (window.confirm(confirmMessage)) {
      deleteThread(threadId);
    }
  };

  if (!mounted) {
    return (
      <div className="card-cosmic h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400">
          <GitBranch className="w-5 h-5 animate-pulse" />
          <p>Loading threads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-cosmic h-full">
      {/* Header */}
      <div className="p-4 border-b border-gold/20">
        <h2 className="text-lg font-semibold text-gold flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          Timelines
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          {threads.length} active thread{threads.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Thread list */}
      <div className="p-2 space-y-2 overflow-y-auto flex-1">
        {threads.map((thread) => {
          const isActive = thread.id === activeThreadId;
          const finalMetrics = thread.nodes[thread.nodes.length - 1]?.metricsAfter || null;
          const sustainabilityScore = finalMetrics?.sustainabilityScore || 50;

          return (
            <button
              key={thread.id}
              onClick={() => setActiveThread(thread.id)}
              className={`
                group w-full text-left p-3 rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-gold/20 border-2 border-gold shadow-glow-gold'
                  : 'bg-cosmic-slate/50 border-2 border-transparent hover:border-gold/40'
                }
              `}
            >
              {/* Thread label and color indicator */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full`}
                    style={{
                      backgroundColor: thread.color === 'gold' ? '#FFD700'
                        : thread.color === 'emerald' ? '#10B981'
                        : thread.color === 'cyan' ? '#06B6D4'
                        : thread.color === 'purple' ? '#A855F7'
                        : '#F43F5E'
                    }}
                  />
                  <span className="font-semibold text-sm text-gray-100">
                    {thread.label}
                  </span>
                </div>

                {/* Delete button (only if not last thread) */}
                {threads.length > 1 && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleDeleteThread(thread.id, e)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleDeleteThread(thread.id, e);
                      }
                    }}
                    className="opacity-50 group-hover:opacity-100 hover:text-red-400 text-gray-400 transition-all cursor-pointer p-1 hover:bg-red-500/10 rounded"
                    title="Delete thread"
                    aria-label="Delete thread"
                  >
                    <Trash2 className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Mini sparkline showing sustainability score */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Score</span>
                  <span className={`font-semibold ${
                    sustainabilityScore >= 70 ? 'text-emerald'
                    : sustainabilityScore >= 40 ? 'text-yellow-400'
                    : 'text-red-400'
                  }`}>
                    {sustainabilityScore.toFixed(0)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-cosmic-dark rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      sustainabilityScore >= 70 ? 'bg-emerald'
                      : sustainabilityScore >= 40 ? 'bg-yellow-400'
                      : 'bg-red-400'
                    }`}
                    style={{ width: `${sustainabilityScore}%` }}
                  />
                </div>
              </div>

              {/* Node count */}
              <div className="mt-2 text-xs text-gray-500">
                {thread.nodes.length} decision{thread.nodes.length !== 1 ? 's' : ''}
                {thread.parentThreadId && (
                  <span className="ml-2 text-gold">
                    ↪ branched
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Add thread button */}
      <div className="p-4 border-t border-gold/20">
        <button
          onClick={handleCreateThread}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Reweave New Thread
        </button>
      </div>
    </div>
  );
}
