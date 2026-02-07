'use client';

/**
 * ImpactPanel - Right sidebar showing current metrics and oracle summary
 */

import { useState, useEffect } from 'react';
import { useThreadweaverStore } from '@/lib/store/useThreadweaverStore';
import { METRIC_LABELS, METRIC_ICONS } from '@/lib/types';
import { TrendingDown, TrendingUp, Activity } from 'lucide-react';
import BusinessStateCard from './BusinessStateCard';

export default function ImpactPanel() {
  const [mounted, setMounted] = useState(false);
  const { getCurrentMetrics, getActiveThread } = useThreadweaverStore();
  const currentMetrics = getCurrentMetrics();
  const activeThread = getActiveThread();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get most recent node for oracle summary
  const lastNode = activeThread?.nodes[activeThread.nodes.length - 1];

  if (!mounted) {
    return (
      <div className="card-cosmic h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400">
          <Activity className="w-5 h-5 animate-pulse" />
          <p>Loading metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col overflow-y-auto">
      {/* Metrics display */}
      <div className="card-cosmic">
        <div className="p-4 border-b border-gold/20">
          <h2 className="text-lg font-semibold text-emerald flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Current Impact
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Real-time sustainability metrics
          </p>
        </div>

        <div className="p-4 space-y-4">
          {/* Sustainability Score (aggregate) */}
          <div className="p-3 bg-gradient-to-br from-emerald/10 to-gold/10 rounded-lg border border-emerald/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-emerald">
                Sustainability Score
              </span>
              <span className="text-2xl font-bold text-emerald">
                {currentMetrics.sustainabilityScore.toFixed(0)}
              </span>
            </div>
            <div className="h-2 bg-cosmic-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald to-gold transition-all duration-500"
                style={{ width: `${currentMetrics.sustainabilityScore}%` }}
              />
            </div>
          </div>

          {/* Individual metrics */}
          <div className="space-y-3">
            {/* Waste */}
            <MetricBar
              label={METRIC_LABELS.waste}
              icon={METRIC_ICONS.waste}
              value={currentMetrics.waste}
              inverted={true}
            />

            {/* Emissions */}
            <MetricBar
              label={METRIC_LABELS.emissions}
              icon={METRIC_ICONS.emissions}
              value={currentMetrics.emissions}
              inverted={true}
            />

            {/* Cost */}
            <MetricBar
              label={METRIC_LABELS.cost}
              icon={METRIC_ICONS.cost}
              value={currentMetrics.cost}
              inverted={true}
            />

            {/* Efficiency */}
            <MetricBar
              label={METRIC_LABELS.efficiency}
              icon={METRIC_ICONS.efficiency}
              value={currentMetrics.efficiency}
              inverted={false}
            />

            {/* Community Trust */}
            <MetricBar
              label={METRIC_LABELS.communityTrust}
              icon={METRIC_ICONS.communityTrust}
              value={currentMetrics.communityTrust}
              inverted={false}
            />
          </div>
        </div>
      </div>

      {/* Business State - Story of the business progression */}
      <BusinessStateCard />

      {/* Oracle Summary */}
      {lastNode && (
        <div className="card-cosmic">
          <div className="p-4 border-b border-gold/20">
            <h3 className="text-sm font-semibold text-gold">Oracle's Wisdom</h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-300 leading-relaxed">
              {lastNode.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual metric bar component
 */
function MetricBar({
  label,
  icon,
  value,
  inverted,
}: {
  label: string;
  icon: string;
  value: number;
  inverted: boolean;
}) {
  // Color logic: inverted metrics (waste, emissions, cost) are bad when high
  const getColor = () => {
    if (inverted) {
      // Lower is better
      if (value <= 30) return 'text-emerald';
      if (value <= 60) return 'text-yellow-400';
      return 'text-red-400';
    } else {
      // Higher is better
      if (value >= 70) return 'text-emerald';
      if (value >= 40) return 'text-yellow-400';
      return 'text-red-400';
    }
  };

  const getBarColor = () => {
    if (inverted) {
      if (value <= 30) return 'bg-emerald';
      if (value <= 60) return 'bg-yellow-400';
      return 'bg-red-400';
    } else {
      if (value >= 70) return 'bg-emerald';
      if (value >= 40) return 'bg-yellow-400';
      return 'bg-red-400';
    }
  };

  const getTrendIcon = () => {
    // This would need delta from previous state - simplified for now
    return null;
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <span>{icon}</span>
          {label}
        </span>
        <span className={`text-sm font-semibold ${getColor()}`}>
          {value.toFixed(0)}
        </span>
      </div>
      <div className="h-2 bg-cosmic-dark rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${getBarColor()}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
