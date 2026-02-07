'use client';

/**
 * CompareView - Side-by-side comparison of multiple timelines
 * Shows metric differences and key divergence points
 */

import { useThreadweaverStore } from '@/lib/store/useThreadweaverStore';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { METRIC_LABELS } from '@/lib/types';

export default function CompareView() {
  const {
    threads,
    selectedCompareThreads,
    setShowCompareView,
    setSelectedCompareThreads,
  } = useThreadweaverStore();

  const handleClose = () => {
    setShowCompareView(false);
    setSelectedCompareThreads([]);
  };

  // Get selected threads
  const compareThreads = threads.filter(t =>
    selectedCompareThreads.includes(t.id)
  );

  if (compareThreads.length < 2) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        />
        <div className="relative bg-cosmic-dark border-2 border-gold rounded-xl p-8 max-w-md">
          <p className="text-gray-300 mb-4">
            Select at least 2 timelines to compare
          </p>
          <button onClick={handleClose} className="btn-primary w-full">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-cosmic-dark border-2 border-gold rounded-xl shadow-glow-gold overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gold/20 bg-gradient-to-r from-gold/10 to-emerald/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gold">Timeline Comparison</h2>
              <p className="text-sm text-gray-400 mt-1">
                Comparing {compareThreads.length} alternate futures
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Comparison grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {compareThreads.map((thread) => {
              const finalMetrics = thread.nodes[thread.nodes.length - 1]?.metricsAfter || null;

              return (
                <div
                  key={thread.id}
                  className="card-cosmic border-2"
                  style={{
                    borderColor:
                      thread.color === 'gold' ? '#FFD700'
                      : thread.color === 'emerald' ? '#10B981'
                      : thread.color === 'cyan' ? '#06B6D4'
                      : thread.color === 'purple' ? '#A855F7'
                      : '#F43F5E',
                  }}
                >
                  {/* Thread header */}
                  <div className="p-4 border-b border-gold/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{
                          backgroundColor:
                            thread.color === 'gold' ? '#FFD700'
                            : thread.color === 'emerald' ? '#10B981'
                            : thread.color === 'cyan' ? '#06B6D4'
                            : thread.color === 'purple' ? '#A855F7'
                            : '#F43F5E',
                        }}
                      />
                      <h3 className="font-semibold text-gray-100">{thread.label}</h3>
                    </div>
                    <p className="text-xs text-gray-500">
                      {thread.nodes.length} decision{thread.nodes.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Metrics */}
                  {finalMetrics ? (
                    <div className="p-4 space-y-3">
                      {/* Sustainability Score */}
                      <div className="p-3 bg-gradient-to-br from-emerald/10 to-gold/10 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">
                          {METRIC_LABELS.sustainabilityScore}
                        </div>
                        <div className="text-2xl font-bold text-emerald">
                          {finalMetrics.sustainabilityScore.toFixed(1)}
                        </div>
                      </div>

                      {/* Individual metrics */}
                      {Object.entries(finalMetrics).map(([key, value]) => {
                        if (key === 'sustainabilityScore') return null;

                        return (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">
                              {METRIC_LABELS[key as keyof typeof METRIC_LABELS]}
                            </span>
                            <span className="text-sm font-semibold text-gray-200">
                              {(value as number).toFixed(0)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No decisions made
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Key differences */}
          {compareThreads.length === 2 && (
            <div className="mt-6 card-cosmic">
              <div className="p-4 border-b border-gold/20">
                <h3 className="font-semibold text-gold">Key Differences</h3>
              </div>
              <div className="p-4">
                <MetricDiff
                  thread1={compareThreads[0]}
                  thread2={compareThreads[1]}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Show metric differences between two threads
 */
function MetricDiff({ thread1, thread2 }: { thread1: any; thread2: any }) {
  const metrics1 = thread1.nodes[thread1.nodes.length - 1]?.metricsAfter;
  const metrics2 = thread2.nodes[thread2.nodes.length - 1]?.metricsAfter;

  if (!metrics1 || !metrics2) {
    return <p className="text-sm text-gray-400">No metrics to compare</p>;
  }

  const metricKeys = [
    'sustainabilityScore',
    'waste',
    'emissions',
    'cost',
    'efficiency',
    'communityTrust',
  ] as const;

  return (
    <div className="space-y-2">
      {metricKeys.map((key) => {
        const diff = metrics2[key] - metrics1[key];
        const absDiff = Math.abs(diff);

        if (absDiff < 1) return null;

        return (
          <div
            key={key}
            className="flex items-center justify-between p-2 bg-cosmic-slate/30 rounded"
          >
            <span className="text-sm text-gray-300">
              {METRIC_LABELS[key]}
            </span>
            <div className="flex items-center gap-2">
              {diff > 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-emerald" />
                  <span className="text-sm font-semibold text-emerald">
                    +{diff.toFixed(1)}
                  </span>
                </>
              ) : diff < 0 ? (
                <>
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-semibold text-red-400">
                    {diff.toFixed(1)}
                  </span>
                </>
              ) : (
                <>
                  <Minus className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500">0</span>
                </>
              )}
              <span className="text-xs text-gray-500">
                in {thread2.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
