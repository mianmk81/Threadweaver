'use client';

import { X, ChevronRight, TrendingUp, TrendingDown, GitBranch } from 'lucide-react';
import { useThreadweaverStore } from '@/lib/store/useThreadweaverStore';
import { METRIC_ICONS, METRIC_LABELS, type MetricKey } from '@/lib/types';
import { useEffect, useState } from 'react';
import type { DecisionCard } from '@/lib/types';

interface NodeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NodeDetailsModal({ isOpen, onClose }: NodeDetailsModalProps) {
  const {
    getActiveThread,
    uiState,
    createThread,
    setShowDecisionModal,
    threads,
    activeThreadId,
  } = useThreadweaverStore();
  const [card, setCard] = useState<DecisionCard | null>(null);
  const activeThread = getActiveThread();

  const currentNode = activeThread?.nodes.find(
    (n) => n.step === uiState.selectedNodeStep
  );

  const previousNode = activeThread?.nodes.find(
    (n) => n.step === (uiState.selectedNodeStep ?? 0) - 1
  );

  const handleReweave = () => {
    if (!currentNode || !activeThread) return;

    // For step 0, can't reweave (it's the starting point)
    if (currentNode.step === 0) {
      alert("Cannot reweave from the starting point");
      return;
    }

    // Create a new thread branching from the step before this decision
    const branchPoint = currentNode.step - 1;
    const nextThreadNumber = threads.length + 1;
    const colors: Array<'gold' | 'emerald' | 'cyan' | 'purple'> = ['gold', 'emerald', 'cyan', 'purple'];
    const color = colors[threads.length % colors.length];

    // Create the new branch
    createThread(
      `Reweave ${nextThreadNumber}`,
      color,
      activeThreadId,
      branchPoint
    );

    // Close this modal and open decision modal
    onClose();
    setTimeout(() => {
      setShowDecisionModal(true);
    }, 100);
  };

  useEffect(() => {
    if (!currentNode || currentNode.step === 0) return;

    // Fetch the decision card details from backend API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003';
    fetch(`${apiUrl}/api/cards/${currentNode.cardId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch card: ${res.status}`);
        }
        return res.json();
      })
      .then((card) => {
        setCard(card);
      })
      .catch((err) => {
        console.error('Failed to load card:', err);
        setCard(null);
      });
  }, [currentNode]);

  if (!isOpen || !currentNode) return null;

  // For step 0 (initial node), show a special message
  if (currentNode.step === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
        <div className="bg-cosmic-dark border-2 border-gold/30 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-gold/20 to-emerald/20 border-b border-gold/30 p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gold flex items-center gap-2">
              Starting Point
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gold transition-colors p-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-gray-300 leading-relaxed">
              {currentNode.businessState || currentNode.explanation}
            </p>

            <div className="bg-cosmic-darker/50 rounded-lg p-4 border border-gold/20">
              <h3 className="text-sm font-semibold text-emerald mb-3">Initial Metrics</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(currentNode.metricsAfter).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-lg">{METRIC_ICONS[key as MetricKey]}</span>
                    <div className="flex-1">
                      <div className="text-xs text-gray-400">{METRIC_LABELS[key as MetricKey]}</div>
                      <div className="text-sm font-semibold text-gold">{value.toFixed(0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
        <div className="bg-cosmic-dark border-2 border-gold/30 rounded-lg p-6">
          <p className="text-gray-400">Loading decision details...</p>
        </div>
      </div>
    );
  }

  const chosenOption = card.options.find((opt) => opt.id === currentNode.chosenOptionId);
  const metricsBefore = previousNode?.metricsAfter || currentNode.metricsAfter;

  // Debug logging
  console.log('NodeDetailsModal - currentNode.chosenOptionId:', currentNode.chosenOptionId);
  console.log('NodeDetailsModal - card.options:', card.options.map(o => o.id));
  console.log('NodeDetailsModal - chosenOption:', chosenOption);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-cosmic-dark border-2 border-gold/30 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-gold/20 to-emerald/20 border-b border-gold/30 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="text-xs text-gray-400 mb-1">Step {currentNode.step}</div>
              <h2 className="text-xl font-bold text-gold">{card.title}</h2>
              {chosenOption && (
                <div className="mt-1 text-sm text-emerald">
                  ✓ You chose: {chosenOption.label}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {currentNode.step > 0 && (
                <button
                  onClick={handleReweave}
                  className="btn-secondary flex items-center gap-2 text-sm"
                  title="Create a new timeline branch from this point with a different choice"
                >
                  <GitBranch className="w-4 h-4" />
                  Reweave from Here
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gold transition-colors p-1"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Reweave Info - only show for nodes after step 0 */}
          {currentNode.step > 0 && (
            <div className="bg-purple/10 border border-purple/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <GitBranch className="w-5 h-5 text-purple mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-purple mb-1">Want to make a different choice?</h3>
                  <p className="text-xs text-gray-400">
                    Click "Reweave from Here" to create a new timeline branch where you can explore a different path
                    from this point. Your current timeline will remain unchanged.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Decision Prompt */}
          <div>
            <h3 className="text-sm font-semibold text-emerald mb-2">Decision Prompt</h3>
            <p className="text-gray-300">{card.prompt}</p>
          </div>

          {/* Available Options */}
          <div>
            <h3 className="text-sm font-semibold text-emerald mb-3">
              Available Options {chosenOption && <span className="text-gold">→ You chose: {chosenOption.label}</span>}
            </h3>
            <div className="space-y-3">
              {card.options.map((option) => {
                const isChosen = option.id === currentNode.chosenOptionId;
                return (
                  <div
                    key={option.id}
                    className={`rounded-lg p-4 border-2 transition-all ${
                      isChosen
                        ? 'border-gold border-4 bg-gold/20 shadow-lg shadow-gold/30'
                        : 'border-gray-700 bg-cosmic-darker/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {isChosen && (
                            <span className="text-2xl">✓</span>
                          )}
                          <h4 className={`font-semibold text-lg ${isChosen ? 'text-gold' : 'text-gray-300'}`}>
                            {option.label}
                          </h4>
                          {isChosen && (
                            <span className="px-3 py-1 bg-gold text-cosmic-dark text-sm font-bold rounded-full">
                              YOUR CHOICE
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-3">{option.description}</p>

                        {/* Delta Preview */}
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(option.deltas).map(([key, delta]) => {
                            if (delta === 0) return null;
                            const isPositive = delta > 0;
                            const metricKey = key as MetricKey;
                            // For waste, emissions, cost - negative is good
                            const isGood =
                              ['waste', 'emissions', 'cost'].includes(key)
                                ? delta < 0
                                : delta > 0;

                            return (
                              <div
                                key={key}
                                className={`flex items-center gap-1 text-xs ${
                                  isGood ? 'text-emerald' : 'text-red-400'
                                }`}
                              >
                                {isPositive ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : (
                                  <TrendingDown className="w-3 h-3" />
                                )}
                                <span>{METRIC_ICONS[metricKey]}</span>
                                <span className="font-semibold">
                                  {delta > 0 ? '+' : ''}
                                  {delta}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {isChosen && option.explanation && (
                      <div className="mt-3 pt-3 border-t border-gold/20">
                        <p className="text-sm text-gray-300">{option.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metrics Comparison */}
          <div>
            <h3 className="text-sm font-semibold text-emerald mb-3">Metrics Impact</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(currentNode.metricsAfter).map(([key, valueAfter]) => {
                const valueBefore = metricsBefore[key as keyof typeof metricsBefore];
                const delta = valueAfter - valueBefore;
                const metricKey = key as MetricKey;

                return (
                  <div key={key} className="bg-cosmic-darker/50 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{METRIC_ICONS[metricKey]}</span>
                      <span className="text-sm text-gray-400">{METRIC_LABELS[metricKey]}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{valueBefore.toFixed(0)}</span>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                      <span className="text-lg font-bold text-gold">{valueAfter.toFixed(0)}</span>
                      {delta !== 0 && (
                        <span
                          className={`text-xs font-semibold ${
                            delta > 0 ? 'text-emerald' : 'text-red-400'
                          }`}
                        >
                          ({delta > 0 ? '+' : ''}
                          {delta.toFixed(0)})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Business State */}
          {currentNode.businessState && (
            <div className="bg-gradient-to-br from-emerald/10 to-gold/10 rounded-lg p-4 border border-emerald/20">
              <h3 className="text-sm font-semibold text-emerald mb-2">Business State</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{currentNode.businessState}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
