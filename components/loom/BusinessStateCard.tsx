'use client';

/**
 * BusinessStateCard - Shows the narrative state of the business at current step
 * Tells the story of how the business is progressing through sustainability journey
 */

import { Building2, TrendingUp } from 'lucide-react';
import { useThreadweaverStore } from '@/lib/store/useThreadweaverStore';

export default function BusinessStateCard() {
  const { getActiveThread, currentStep } = useThreadweaverStore();
  const activeThread = getActiveThread();

  // Get the node at the current step
  const currentNode = activeThread?.nodes.find((n) => n.step === currentStep);

  if (!currentNode || !currentNode.businessState) {
    return null;
  }

  return (
    <div className="card-cosmic">
      <div className="p-4 border-b border-emerald/20 bg-gradient-to-r from-emerald/10 to-gold/10">
        <h3 className="text-sm font-semibold text-emerald flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Business State
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Current state of your sustainability journey
        </p>
      </div>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <TrendingUp className="w-5 h-5 text-emerald" />
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            {currentNode.businessState}
          </p>
        </div>
      </div>
    </div>
  );
}
