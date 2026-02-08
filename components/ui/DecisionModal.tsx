'use client';

/**
 * DecisionModal - Modal for choosing between decision options
 * Shows card prompt and 2-3 options with impact preview
 */

import { useState, useEffect } from 'react';
import { useThreadweaverStore } from '@/lib/store/useThreadweaverStore';
import { generateDecision, applyDecision } from '@/lib/utils/api';
import type { DecisionCard, DecisionOption } from '@/lib/types';
import { X, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

export default function DecisionModal() {
  const {
    getCurrentMetrics,
    getActiveThread,
    currentStep,
    setShowDecisionModal,
    addNode,
    activeThreadId,
  } = useThreadweaverStore();

  const [card, setCard] = useState<DecisionCard | null>(null);
  const [selectedOption, setSelectedOption] = useState<DecisionOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentMetrics = getCurrentMetrics();
  const activeThread = getActiveThread();
  // Filter out the initial node (step 0) when collecting used card IDs
  const usedCardIds = activeThread?.nodes
    .filter(n => n.step > 0)
    .map(n => n.cardId) || [];

  // Fetch decision card on mount
  useEffect(() => {
    // Safety check: don't fetch if timeline is already complete
    if (currentStep >= 10) {
      setError('Timeline is complete. No more decisions can be made.');
      setLoading(false);
      return;
    }
    fetchDecisionCard();
  }, []);

  const fetchDecisionCard = async () => {
    setLoading(true);
    setError(null);

    try {
      const requestData = {
        currentMetrics,
        usedCardIds,
        step: currentStep,
      };

      console.log('DecisionModal - Current step:', currentStep);
      console.log('DecisionModal - Used cards:', usedCardIds.length, usedCardIds);
      console.log('DecisionModal - Current metrics:', currentMetrics);
      console.log('DecisionModal - Sending request:', requestData);

      const response = await generateDecision(requestData);

      console.log('DecisionModal - Received card:', response.card.id, response.card.title);
      setCard(response.card);
    } catch (err) {
      console.error('DecisionModal - ERROR:', err);
      console.error('DecisionModal - Error message:', err instanceof Error ? err.message : 'Unknown error');
      setError(err instanceof Error ? err.message : 'Failed to load decision');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (option: DecisionOption) => {
    setSelectedOption(option);
  };

  const handleConfirm = async () => {
    if (!card || !selectedOption) return;

    // Safety check: don't create decision beyond step 10
    if (currentStep >= 10) {
      setError('Timeline is complete. Cannot add more decisions.');
      return;
    }

    setApplying(true);
    setError(null);

    try {
      console.log('DecisionModal - Applying decision:', card.id, selectedOption.id);
      console.log('DecisionModal - Current step before:', currentStep);

      const response = await applyDecision({
        currentMetrics,
        cardId: card.id,
        optionId: selectedOption.id,
      });

      const newNode = {
        step: currentStep + 1,
        cardId: card.id,
        chosenOptionId: selectedOption.id,
        metricsAfter: response.newMetrics,
        explanation: response.explanation,
        businessState: response.businessState,
      };

      console.log('DecisionModal - Adding node:', newNode);

      // Add node to timeline
      addNode(activeThreadId, newNode);

      console.log('DecisionModal - Node added, new step should be:', currentStep + 1);

      // Close modal
      setShowDecisionModal(false);
    } catch (err) {
      console.error('DecisionModal - Apply error:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply decision');
    } finally {
      setApplying(false);
    }
  };

  const handleClose = () => {
    setShowDecisionModal(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="decision-modal-title"
      aria-describedby="decision-modal-description"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl bg-cosmic-dark border-2 border-gold rounded-xl shadow-glow-gold overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gold/20 bg-gradient-to-r from-gold/10 to-emerald/10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {loading ? (
                <div className="h-8 w-3/4 bg-cosmic-slate animate-pulse rounded" />
              ) : (
                <>
                  <h2
                    id="decision-modal-title"
                    className="text-2xl font-bold text-gold mb-2"
                  >
                    {card?.title}
                  </h2>
                  <div className="flex gap-2 flex-wrap">
                    {card?.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-cosmic-slate rounded-full text-gray-300"
                      >
                        #{tag}
                      </span>
                    ))}
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        card?.severity === 'hard'
                          ? 'bg-red-500/20 text-red-300'
                          : card?.severity === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-emerald/20 text-emerald'
                      }`}
                    >
                      {card?.severity}
                    </span>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Close decision modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Prompt */}
        <div className="p-6 border-b border-gold/20">
          {loading ? (
            <div className="space-y-2">
              <div className="h-4 bg-cosmic-slate animate-pulse rounded w-full" />
              <div className="h-4 bg-cosmic-slate animate-pulse rounded w-5/6" />
            </div>
          ) : (
            <p
              id="decision-modal-description"
              className="text-lg text-gray-200 leading-relaxed"
            >
              {card?.prompt}
            </p>
          )}
        </div>

        {/* Options */}
        <div className="p-6 space-y-4">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 bg-cosmic-slate animate-pulse rounded-lg"
                />
              ))}
            </>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">{error}</p>
              <button onClick={fetchDecisionCard} className="btn-secondary">
                Try Again
              </button>
            </div>
          ) : (
            card?.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option)}
                data-testid={`option-${option.id}`}
                data-option-id={option.id}
                className={`
                  w-full text-left p-4 rounded-lg border-2 transition-all duration-200
                  ${selectedOption?.id === option.id
                    ? 'border-gold bg-gold/10 shadow-glow-gold'
                    : 'border-cosmic-slate bg-cosmic-slate/30 hover:border-gold/40'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-100 flex-1">
                    {option.label}
                  </h3>
                  {selectedOption?.id === option.id && (
                    <Sparkles className="w-5 h-5 text-gold animate-pulse" />
                  )}
                </div>

                <p className="text-sm text-gray-400 mb-3">
                  {option.description}
                </p>

                {/* Impact preview */}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(option.deltas).map(([key, value]) => {
                    const numValue = value as number;
                    if (numValue === 0) return null;

                    return (
                      <span
                        key={key}
                        className={`
                          px-2 py-1 text-xs rounded-full flex items-center gap-1
                          ${numValue > 0
                            ? 'bg-emerald/20 text-emerald'
                            : 'bg-red-500/20 text-red-300'
                          }
                        `}
                      >
                        {numValue > 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {numValue > 0 ? '+' : ''}{numValue} {key}
                      </span>
                    );
                  })}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        {!loading && !error && (
          <div className="p-6 border-t border-gold/20 bg-cosmic-slate/30">
            <div className="flex justify-between items-center">
              <button
                onClick={handleClose}
                className="btn-ghost"
                disabled={applying}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="btn-primary"
                disabled={!selectedOption || applying}
              >
                {applying ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Weaving...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Confirm Decision
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
