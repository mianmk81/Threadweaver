'use client';

/**
 * LoomCanvas - SVG timeline visualization
 * Shows timeline threads with decision nodes and rune markers
 */

import { useState, useEffect } from 'react';
import { useThreadweaverStore } from '@/lib/store/useThreadweaverStore';
import { Sparkles, Circle, Maximize2 } from 'lucide-react';

export default function LoomCanvas() {
  const [mounted, setMounted] = useState(false);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1000, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const {
    threads,
    activeThreadId,
    getActiveThread,
    setActiveThread,
    currentStep,
    setShowDecisionModal,
    setShowNodeDetails,
    hoveredNode,
    setHoveredNode,
  } = useThreadweaverStore();

  const activeThread = getActiveThread();

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="card-cosmic h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <p>Loading Loom...</p>
        </div>
      </div>
    );
  }

  if (!activeThread) {
    return (
      <div className="card-cosmic h-full flex items-center justify-center">
        <p className="text-gray-400">No active timeline</p>
      </div>
    );
  }

  // Calculate Y position for each thread (spread them vertically)
  const getThreadYPosition = (threadIndex: number, totalThreads: number) => {
    if (totalThreads === 1) return 50; // Center if only one thread

    const spacing = 60 / Math.max(totalThreads - 1, 1); // Spread across 60% of height
    return 20 + (threadIndex * spacing); // Start at 20%, spread downward
  };

  // Calculate positions for nodes
  const nodePositions = Array.from({ length: 11 }, (_, i) => ({
    step: i,
    x: (i / 10) * 100, // Percentage of width
  }));

  const handleNodeClick = (step: number) => {
    const node = activeThread.nodes.find(n => n.step === step);

    if (node) {
      // Past or current node - show details
      setShowNodeDetails(true, step);
    } else if (step > activeThread.nodes.length) {
      // Future node - open decision modal
      setShowDecisionModal(true);
    }
  };

  // Pan/drag handlers
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // Only start drag if clicking on SVG background (not on nodes)
    if ((e.target as SVGElement).tagName === 'svg' || (e.target as SVGElement).tagName === 'rect') {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;

    const dx = (e.clientX - dragStart.x) * (viewBox.width / 1000);
    const dy = (e.clientY - dragStart.y) * (viewBox.height / 600);

    setViewBox(prev => ({
      ...prev,
      x: prev.x - dx,
      y: prev.y - dy,
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();

    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const newWidth = viewBox.width * zoomFactor;
    const newHeight = viewBox.height * zoomFactor;

    // Limit zoom range
    if (newWidth < 500 || newWidth > 2000) return;

    setViewBox(prev => ({
      x: prev.x - (newWidth - prev.width) / 2,
      y: prev.y - (newHeight - prev.height) / 2,
      width: newWidth,
      height: newHeight,
    }));
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!isDragging || e.touches.length !== 1) return;

    const dx = (e.touches[0].clientX - dragStart.x) * (viewBox.width / 1000);
    const dy = (e.touches[0].clientY - dragStart.y) * (viewBox.height / 600);

    setViewBox(prev => ({
      ...prev,
      x: prev.x - dx,
      y: prev.y - dy,
    }));

    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Reset view to default
  const resetView = () => {
    setViewBox({ x: 0, y: 0, width: 1000, height: 600 });
  };

  return (
    <div className="card-cosmic h-full relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gold">
              {activeThread?.label || 'Timeline View'}
            </h2>
            <p className="text-xs text-gray-400">
              {threads.length} timeline{threads.length !== 1 ? 's' : ''} • Click any branch to switch
            </p>
          </div>
          <div className="bg-cosmic-dark/80 border border-emerald/30 rounded-lg px-3 py-1.5 text-xs text-emerald">
            🖱️ Drag to pan • Scroll to zoom
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-20 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={resetView}
          className="p-2 bg-cosmic-dark/80 hover:bg-cosmic-dark border border-gold/30 rounded-lg text-gray-400 hover:text-gold transition-all"
          title="Reset view (double-click also works)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-20 left-4 z-10 bg-cosmic-dark/80 border border-gold/30 rounded-lg px-3 py-2">
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gold opacity-100"></div>
            <span className="text-gray-300">Active Timeline (100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald opacity-30"></div>
            <span className="text-gray-400">Other Timelines (30%)</span>
          </div>
          <div className="text-gray-500 mt-2 pt-2 border-t border-gray-700">
            Click any branch to switch
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        className="w-full h-full"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={resetView}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Grid background */}
        <defs>
          <pattern
            id="grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="rgba(255, 215, 0, 0.05)"
              strokeWidth="1"
            />
          </pattern>

          {/* Glow filter for active nodes */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="1000" height="600" fill="url(#grid)" />

        {/* Render all threads */}
        {threads.map((thread, threadIndex) => {
          const isActiveThread = thread.id === activeThreadId;
          const yPos = getThreadYPosition(threadIndex, threads.length);
          const threadOpacity = isActiveThread ? 1 : 0.3;

          const threadColor =
            thread.color === 'gold' ? '#FFD700'
            : thread.color === 'emerald' ? '#10B981'
            : thread.color === 'cyan' ? '#06B6D4'
            : thread.color === 'purple' ? '#A855F7'
            : '#F43F5E';

          // Determine where this thread starts rendering
          // If it's a branch, only render from the branch point onwards
          const isBranch = thread.parentThreadId && thread.branchPoint !== undefined;
          const startStep = isBranch ? (thread.branchPoint || 0) + 1 : 0;
          const visibleNodes = thread.nodes.filter(n => n.step >= startStep);
          const hasNodes = visibleNodes.length > 0;

          return (
            <g key={thread.id} opacity={threadOpacity}>
              {/* Branch connector (if this thread branches from a parent) */}
              {isBranch && (() => {
                const parentThread = threads.find(t => t.id === thread.parentThreadId);
                if (!parentThread) return null;

                // Validate branchPoint is within bounds
                const branchPoint = thread.branchPoint || 0;
                if (branchPoint < 0 || branchPoint >= nodePositions.length) {
                  return null;
                }

                const parentIndex = threads.indexOf(parentThread);
                const parentY = getThreadYPosition(parentIndex, threads.length);

                // Branch point is where we connect from parent to this thread
                const branchX = nodePositions[branchPoint].x * 10;

                // Find the next step on this thread (first node after branch point)
                const nextNodeStep = startStep;
                if (nextNodeStep >= nodePositions.length) return null;

                const nextX = nodePositions[nextNodeStep].x * 10;

                return (
                  <>
                    {/* Vertical connector from parent to branch point */}
                    <path
                      d={`M ${branchX} ${parentY * 6} L ${branchX} ${yPos * 6}`}
                      fill="none"
                      stroke={threadColor}
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      opacity="0.5"
                    />
                    {/* Horizontal connector from branch point to first node */}
                    <path
                      d={`M ${branchX} ${yPos * 6} L ${nextX} ${yPos * 6}`}
                      fill="none"
                      stroke={threadColor}
                      strokeWidth={isActiveThread ? 4 : 2}
                      strokeDasharray="4,4"
                      opacity="0.7"
                    />
                    {/* Branch indicator circle at divergence point */}
                    <circle
                      cx={branchX}
                      cy={yPos * 6}
                      r="6"
                      fill={threadColor}
                      stroke={threadColor}
                      strokeWidth="2"
                      opacity="0.6"
                    />
                    {/* Branch icon */}
                    <text
                      x={branchX}
                      y={yPos * 6 + 4}
                      textAnchor="middle"
                      fill="#000"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      ↴
                    </text>
                  </>
                );
              })()}

              {/* Timeline path - only render from startStep onwards */}
              {hasNodes && visibleNodes.length > 1 && (
                <path
                  d={`${visibleNodes.map((node, idx) => {
                    if (!nodePositions[node.step]) return '';
                    const x = nodePositions[node.step].x * 10;
                    return idx === 0 ? `M ${x} ${yPos * 6}` : `L ${x} ${yPos * 6}`;
                  }).join(' ')}`}
                  fill="none"
                  stroke={threadColor}
                  strokeWidth={isActiveThread ? 4 : 2}
                  style={{ cursor: 'pointer' }}
                  onClick={() => !isActiveThread && setActiveThread(thread.id)}
                />
              )}

              {/* Thread label */}
              <text
                x="10"
                y={yPos * 6 - 15}
                fill={threadColor}
                fontSize="12"
                fontWeight="600"
                style={{ cursor: 'pointer' }}
                onClick={() => !isActiveThread && setActiveThread(thread.id)}
              >
                {thread.label}
              </text>

              {/* Decision nodes for this thread - only render visible nodes */}
              {visibleNodes.map((node) => {
                const stepIndex = node.step;
                const pos = nodePositions[stepIndex];
                if (!pos) return null;

                const isCurrentStep = isActiveThread && stepIndex === currentStep;
                const isClickable = true;

                return (
                  <g
                    key={`${thread.id}-${stepIndex}`}
                    transform={`translate(${pos.x * 10}, ${yPos * 6})`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (!isActiveThread) {
                        setActiveThread(thread.id);
                      }
                      handleNodeClick(stepIndex);
                    }}
                    onMouseEnter={() => setHoveredNode(node?.cardId || null)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* Node circle */}
                    <circle
                      r={isCurrentStep ? 16 : 12}
                      fill={isCurrentStep ? '#FFD700' : threadColor}
                      stroke={isCurrentStep ? '#FFD700' : threadColor}
                      strokeWidth={isCurrentStep ? 3 : 2}
                      filter={isCurrentStep || hoveredNode === node?.cardId ? 'url(#glow)' : undefined}
                      className="transition-all duration-300"
                      style={{
                        strokeWidth: hoveredNode === node?.cardId ? 3 : (isCurrentStep ? 3 : 2)
                      }}
                    />

                    {/* Step label (only for active thread) */}
                    {isActiveThread && (
                      <text
                        y="35"
                        textAnchor="middle"
                        fill="#999"
                        fontSize="12"
                        fontWeight="600"
                      >
                        {stepIndex === 0 ? 'Now' : `${Math.round(stepIndex * 1.2)}mo`}
                      </text>
                    )}

                    {/* Decision marker */}
                    <g opacity={hoveredNode === node?.cardId ? 1 : 0.7}>
                      <circle r="6" fill={isActiveThread ? '#10B981' : threadColor} />
                      <text
                        y="4"
                        textAnchor="middle"
                        fill="#000"
                        fontSize="10"
                      >
                        ✓
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          );
        })}

      </svg>

      {/* Action prompt */}
      {currentStep < 10 && activeThread.nodes.length < 11 ? (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <button
            onClick={() => setShowDecisionModal(true)}
            className="btn-primary flex items-center gap-2 shadow-glow-gold animate-pulse"
          >
            <Sparkles className="w-4 h-4" />
            Make Next Decision
          </button>
        </div>
      ) : activeThread.nodes.length >= 11 ? (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-emerald/20 border border-emerald/50 rounded-lg px-4 py-2">
          <p className="text-sm text-emerald font-semibold">
            ✨ Timeline Complete! Click any node to review or reweave
          </p>
        </div>
      ) : null}
    </div>
  );
}
