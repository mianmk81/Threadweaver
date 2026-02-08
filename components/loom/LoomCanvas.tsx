'use client';

/**
 * LoomCanvas - Living Loom SVG timeline visualization
 * Phase 1: Enhanced static rendering with smooth Catmull-Rom splines
 * Shows timeline threads with smooth curves, decision nodes, and rune markers
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useThreadweaverStore } from '@/lib/store/useThreadweaverStore';
import { Sparkles, Circle, Maximize2, Trash2 } from 'lucide-react';
import {
  generateThreadControlPoints,
  catmullRomSpline,
  pointsToSVGPath,
  type Point,
} from '@/lib/utils/spline';
import { createNoise2D } from 'simplex-noise';

export default function LoomCanvas() {
  const [mounted, setMounted] = useState(false);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1000, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredThreadId, setHoveredThreadId] = useState<string | null>(null);

  // Phase 2: Breathing animation state
  const [time, setTime] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const noiseRef = useRef<ReturnType<typeof createNoise2D> | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Phase 3: Live branch growth tracking
  const [revealProgress, setRevealProgress] = useState<Record<string, number>>({});
  const previousThreadCountRef = useRef(0);

  // Phase 4: Grab and pull interaction
  const [draggedNode, setDraggedNode] = useState<{
    threadId: string;
    nodeStep: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [pullOffset, setPullOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpringBack, setIsSpringBack] = useState(false);

  // Phase 5: Click ripple effects
  const [clickedNode, setClickedNode] = useState<{
    threadId: string;
    nodeStep: number;
    timestamp: number;
  } | null>(null);

  // Phase 6: Performance optimization - memoize expensive calculations
  const [performanceMode, setPerformanceMode] = useState<'high' | 'balanced' | 'low'>('high');

  const {
    threads,
    activeThreadId,
    getActiveThread,
    setActiveThread,
    deleteThread,
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

    // Initialize noise generator for breathing animation
    if (!noiseRef.current) {
      noiseRef.current = createNoise2D();
    }
  }, []);

  // Phase 2: Breathing animation loop
  useEffect(() => {
    if (!mounted || !isAnimating) return;

    const animate = () => {
      setTime((t) => t + 0.016); // ~60fps (16ms per frame)
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mounted, isAnimating]);

  // Pause animation when tab is hidden (performance optimization)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsAnimating(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Phase 3: Detect new threads and animate their growth
  useEffect(() => {
    if (threads.length > previousThreadCountRef.current) {
      // New thread(s) added - find which ones are new
      const newThreads = threads.slice(previousThreadCountRef.current);

      newThreads.forEach((thread) => {
        // Initialize reveal progress at 0
        setRevealProgress((prev) => ({ ...prev, [thread.id]: 0 }));

        // Animate from 0 to 1 over 600ms
        const startTime = Date.now();
        const duration = 600; // ms

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Ease-out cubic for smooth deceleration
          const eased = 1 - Math.pow(1 - progress, 3);

          setRevealProgress((prev) => ({ ...prev, [thread.id]: eased }));

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
      });
    }

    previousThreadCountRef.current = threads.length;
  }, [threads.length, threads]);

  // Initialize existing threads to full reveal
  useEffect(() => {
    if (!mounted) return;

    threads.forEach((thread) => {
      setRevealProgress((prev) => {
        if (prev[thread.id] === undefined) {
          return { ...prev, [thread.id]: 1 };
        }
        return prev;
      });
    });
  }, [mounted, threads]);

  // Phase 6: Auto-adjust performance mode based on thread count
  useEffect(() => {
    if (threads.length > 10) {
      setPerformanceMode('low');
    } else if (threads.length > 5) {
      setPerformanceMode('balanced');
    } else {
      setPerformanceMode('high');
    }
  }, [threads.length]);

  // Phase 2: Create wiggle function for breathing animation (Phase 6: optimized)
  // MUST be before early returns to maintain consistent hook order
  const createWiggleFunction = useCallback(
    (threadIndex: number, isActive: boolean) => {
      if (!noiseRef.current) return undefined;

      // Phase 6: Adjust amplitude based on performance mode
      let amplitudeMultiplier = 1;
      if (performanceMode === 'balanced') {
        amplitudeMultiplier = isActive ? 1 : 0.5; // Reduce inactive thread motion
      } else if (performanceMode === 'low') {
        amplitudeMultiplier = isActive ? 0.8 : 0; // Only animate active thread
      }

      const amplitude = (isActive ? 4 : 2) * amplitudeMultiplier;
      if (amplitude === 0) return undefined; // Skip calculation entirely

      const frequency = 0.008; // Controls wave tightness
      const speed = 0.3; // Animation speed

      return (x: number): number => {
        // Use thread index as noise seed for unique movement per thread
        const noiseValue = noiseRef.current!(
          x * frequency,
          time * speed + threadIndex * 10
        );

        // Simplex noise returns [-1, 1], scale to desired amplitude
        return noiseValue * amplitude;
      };
    },
    [time, performanceMode]
  );

  // Phase 4: Calculate deformation offset for grab-and-pull
  // MUST be before early returns to maintain consistent hook order
  const calculateDeformationOffset = useCallback(
    (nodeX: number, currentX: number, isDragged: boolean) => {
      if (!draggedNode || !isDragged) return { x: 0, y: 0 };

      // Distance from dragged node affects deformation strength
      const distance = Math.abs(currentX - nodeX);
      const maxInfluenceDistance = 300; // Deformation influence radius

      if (distance > maxInfluenceDistance) return { x: 0, y: 0 };

      // Gaussian falloff for natural elastic feel
      const influence = Math.exp(-(distance * distance) / (2 * 100 * 100));

      return {
        x: pullOffset.x * influence,
        y: pullOffset.y * influence,
      };
    },
    [draggedNode, pullOffset]
  );

  // Phase 4: Handle node drag start
  const handleNodeDragStart = useCallback(
    (e: React.MouseEvent, threadId: string, nodeStep: number, nodeX: number, nodeY: number) => {
      e.stopPropagation();
      setIsDragging(false); // Disable canvas pan while dragging node

      setDraggedNode({
        threadId,
        nodeStep,
        startX: e.clientX,
        startY: e.clientY,
      });
      setPullOffset({ x: 0, y: 0 });
    },
    []
  );

  // Phase 4: Handle node drag move
  const handleNodeDragMove = useCallback(
    (e: MouseEvent) => {
      if (!draggedNode) return;

      const dx = e.clientX - draggedNode.startX;
      const dy = e.clientY - draggedNode.startY;

      // Scale movement to SVG coordinates
      const scaledDx = dx * (viewBox.width / 1000);
      const scaledDy = dy * (viewBox.height / 600);

      setPullOffset({ x: scaledDx, y: scaledDy });
    },
    [draggedNode, viewBox]
  );

  // Phase 4: Handle node drag end (spring back)
  const handleNodeDragEnd = useCallback(() => {
    if (!draggedNode) return;

    setIsSpringBack(true);

    // Animate spring back using requestAnimationFrame
    const startOffset = { ...pullOffset };
    const startTime = Date.now();
    const duration = 400; // Spring duration in ms

    const springBack = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Spring easing: elastic ease-out
      const eased =
        progress === 1
          ? 1
          : 1 - Math.pow(2, -10 * progress) * Math.cos((progress * 10 - 0.75) * ((2 * Math.PI) / 3));

      setPullOffset({
        x: startOffset.x * (1 - eased),
        y: startOffset.y * (1 - eased),
      });

      if (progress < 1) {
        requestAnimationFrame(springBack);
      } else {
        setDraggedNode(null);
        setPullOffset({ x: 0, y: 0 });
        setIsSpringBack(false);
      }
    };

    requestAnimationFrame(springBack);
  }, [draggedNode, pullOffset]);

  // Phase 4: Attach global mouse listeners for node dragging
  useEffect(() => {
    if (!draggedNode) return;

    window.addEventListener('mousemove', handleNodeDragMove);
    window.addEventListener('mouseup', handleNodeDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleNodeDragMove);
      window.removeEventListener('mouseup', handleNodeDragEnd);
    };
  }, [draggedNode, handleNodeDragMove, handleNodeDragEnd]);

  // Early returns AFTER all hooks
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

  // Helper functions and calculations (after hooks and early returns)

  // Calculate Y position for each thread (spread them vertically)
  const getThreadYPosition = (threadIndex: number, totalThreads: number) => {
    if (totalThreads === 1) return 50; // Center if only one thread

    const spacing = 40 / Math.max(totalThreads - 1, 1); // Spread across 40% of height (tighter spacing)
    return 30 + (threadIndex * spacing); // Start at 30%, spread downward
  };

  // Calculate positions for nodes
  const nodePositions = Array.from({ length: 11 }, (_, i) => ({
    step: i,
    x: (i / 10) * 100, // Percentage of width
  }));

  const handleNodeClick = (step: number, threadId?: string) => {
    const node = activeThread.nodes.find(n => n.step === step);

    // Phase 5: Trigger ripple effect
    if (threadId) {
      setClickedNode({ threadId, nodeStep: step, timestamp: Date.now() });
      setTimeout(() => setClickedNode(null), 800); // Clear after animation
    }

    if (node) {
      // Past or current node - show details
      setShowNodeDetails(true, step);
    } else {
      // Future node - open decision modal (only if timeline not complete)
      const lastStep = activeThread.nodes.length > 0
        ? Math.max(...activeThread.nodes.map(n => n.step))
        : 0;

      if (lastStep < 10) {
        setShowDecisionModal(true);
      }
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

        {/* Breathing animation toggle */}
        <button
          onClick={() => setIsAnimating(!isAnimating)}
          className={`p-2 bg-cosmic-dark/80 hover:bg-cosmic-dark border rounded-lg transition-all ${
            isAnimating
              ? 'border-emerald/50 text-emerald'
              : 'border-gray-600 text-gray-400'
          }`}
          title={isAnimating ? 'Breathing ON (click to pause)' : 'Breathing OFF (click to enable)'}
          aria-label={isAnimating ? 'Pause breathing animation' : 'Enable breathing animation'}
        >
          <Circle
            className={`w-4 h-4 ${isAnimating ? 'animate-pulse' : ''}`}
            fill={isAnimating ? 'currentColor' : 'none'}
          />
        </button>

        {/* Phase 6: Performance mode indicator */}
        {performanceMode !== 'high' && (
          <div className="px-2 py-1 bg-cosmic-dark/80 border border-gold/30 rounded-lg text-xs">
            <span className={performanceMode === 'balanced' ? 'text-yellow-400' : 'text-orange-400'}>
              {performanceMode === 'balanced' ? '⚡ Balanced' : '🔋 Power Save'}
            </span>
          </div>
        )}
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

      {/* SVG Canvas with accessibility */}
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
        role="img"
        aria-label="Timeline visualization showing sustainability decision branches"
      >
        {/* Enhanced SVG Definitions for Living Loom */}
        <defs>
          {/* Cosmic grid background */}
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

          {/* Enhanced glow filter for active nodes */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Intense glow for hovered nodes */}
          <filter id="intense-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur1" />
            <feGaussianBlur stdDeviation="4" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Thread glow - subtle aura around threads */}
          <filter id="thread-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradient definitions for thread colors */}
          <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#FFD700" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="emerald-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="1" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="cyan-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#06B6D4" stopOpacity="1" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="purple-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#A855F7" stopOpacity="1" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0.6" />
          </linearGradient>

          {/* Phase 6: Subtle turbulence filter for atmospheric effect */}
          <filter id="turbulence" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.01"
              numOctaves="2"
              result="turbulence"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="turbulence"
              scale="2"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        <rect width="1000" height="600" fill="url(#grid)" />

        {/* Phase 6: Floating particles for atmosphere */}
        {performanceMode === 'high' && (
          <g opacity="0.15">
            {Array.from({ length: 12 }).map((_, i) => {
              const x = (i * 83 + Math.sin(time * 0.5 + i) * 50) % 1000;
              const y = (i * 47 + Math.cos(time * 0.3 + i) * 30) % 600;
              return (
                <circle
                  key={`particle-${i}`}
                  cx={x}
                  cy={y}
                  r={1 + Math.sin(time + i) * 0.5}
                  fill="#FFD700"
                  opacity={0.3 + Math.sin(time * 2 + i) * 0.2}
                />
              );
            })}
          </g>
        )}

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
              {/* Enhanced branch connector with smooth curves */}
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

                // Create smooth curve for vertical connector using quadratic bezier
                const verticalCurve = `M ${branchX} ${parentY * 6} Q ${branchX + 20} ${(parentY * 6 + yPos * 6) / 2} ${branchX} ${yPos * 6}`;

                // Create smooth curve for horizontal connector
                const horizontalCurve = `M ${branchX} ${yPos * 6} Q ${(branchX + nextX) / 2} ${yPos * 6 - 10} ${nextX} ${yPos * 6}`;

                return (
                  <>
                    {/* Curved vertical connector from parent to branch point */}
                    <path
                      d={verticalCurve}
                      fill="none"
                      stroke={threadColor}
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      opacity="0.5"
                      strokeLinecap="round"
                    />
                    {/* Curved horizontal connector from branch point to first node */}
                    <path
                      d={horizontalCurve}
                      fill="none"
                      stroke={threadColor}
                      strokeWidth={isActiveThread ? 4 : 2}
                      strokeDasharray="4,4"
                      opacity="0.7"
                      strokeLinecap="round"
                    />
                    {/* Enhanced branch indicator with glow */}
                    <circle
                      cx={branchX}
                      cy={yPos * 6}
                      r="8"
                      fill={threadColor}
                      stroke={threadColor}
                      strokeWidth="2"
                      opacity="0.3"
                      filter="url(#glow)"
                    />
                    <circle
                      cx={branchX}
                      cy={yPos * 6}
                      r="6"
                      fill={threadColor}
                      stroke={threadColor}
                      strokeWidth="2"
                      opacity="0.8"
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

              {/* Enhanced Timeline path with smooth Catmull-Rom splines + breathing + deformation */}
              {hasNodes && visibleNodes.length >= 1 && (() => {
                // Generate control points from visible nodes with wiggle and deform effects
                const nodeSteps = visibleNodes.map(n => n.step);
                const wiggleFunction = createWiggleFunction(threadIndex, isActiveThread);

                // Phase 4: Deformation function for grabbed thread
                const deformFunction = draggedNode?.threadId === thread.id
                  ? (x: number) => calculateDeformationOffset(
                      (draggedNode.nodeStep / 10) * 1000,
                      x,
                      true
                    )
                  : undefined;

                const controlPoints = generateThreadControlPoints(
                  nodeSteps,
                  yPos * 6,
                  1000,
                  wiggleFunction,
                  deformFunction
                );

                // Generate smooth spline curve through control points
                const splinePoints = catmullRomSpline(controlPoints, 0.5, 8);
                const { path: pathData, length: pathLength } = pointsToSVGPath(splinePoints);

                const gradientId =
                  thread.color === 'gold' ? 'gold-gradient'
                  : thread.color === 'emerald' ? 'emerald-gradient'
                  : thread.color === 'cyan' ? 'cyan-gradient'
                  : thread.color === 'purple' ? 'purple-gradient'
                  : undefined;

                // Phase 3: Branch reveal animation
                const progress = revealProgress[thread.id] ?? 1;
                const isRevealing = progress < 1;
                const dashOffset = pathLength * (1 - progress);

                return (
                  <>
                    {/* Glow layer (wider, semi-transparent) */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={threadColor}
                      strokeWidth={isActiveThread ? 8 : 4}
                      opacity={isActiveThread ? 0.3 : 0.15}
                      style={{ cursor: 'pointer' }}
                      onClick={() => !isActiveThread && setActiveThread(thread.id)}
                      strokeDasharray={isRevealing ? pathLength : undefined}
                      strokeDashoffset={isRevealing ? dashOffset : undefined}
                    />
                    {/* Main thread path with reveal animation */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={gradientId ? `url(#${gradientId})` : threadColor}
                      strokeWidth={isActiveThread ? 4 : 2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter={isActiveThread ? 'url(#thread-glow)' : undefined}
                      style={{ cursor: 'pointer' }}
                      onClick={() => !isActiveThread && setActiveThread(thread.id)}
                      strokeDasharray={isRevealing ? pathLength : undefined}
                      strokeDashoffset={isRevealing ? dashOffset : undefined}
                    />
                  </>
                );
              })()}

              {/* Thread label with delete button */}
              <g
                onMouseEnter={() => setHoveredThreadId(thread.id)}
                onMouseLeave={() => setHoveredThreadId(null)}
              >
                {/* Invisible hover area to keep button visible when moving mouse */}
                {isActiveThread && threads.length > 1 && (
                  <rect
                    x="5"
                    y={yPos * 6 - 28}
                    width={thread.label.length * 7 + 35}
                    height="20"
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                  />
                )}

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

                {/* Delete button - only show on active thread when hovering */}
                {hoveredThreadId === thread.id && isActiveThread && threads.length > 1 && (
                  <g
                    transform={`translate(${thread.label.length * 7 + 20}, ${yPos * 6 - 22})`}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete thread "${thread.label}"?`)) {
                        deleteThread(thread.id);
                      }
                    }}
                  >
                    {/* Circle background */}
                    <circle r="10" fill="rgba(239, 68, 68, 0.8)" stroke="#ef4444" strokeWidth="1" />
                    {/* X symbol */}
                    <text
                      x="0"
                      y="0"
                      fill="white"
                      fontSize="14"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      ×
                    </text>
                  </g>
                )}
              </g>

              {/* Decision nodes for this thread - only render visible nodes with breathing */}
              {visibleNodes.map((node, nodeIndex) => {
                const stepIndex = node.step;
                const pos = nodePositions[stepIndex];
                if (!pos) return null;

                const isCurrentStep = isActiveThread && stepIndex === currentStep;
                const isClickable = true;

                // Use node.id if available, otherwise use thread-step-index combination
                const uniqueKey = node.id || `${thread.id}-step${node.step}-idx${nodeIndex}`;

                // Apply wiggle offset to node position
                const wiggleFunction = createWiggleFunction(threadIndex, isActiveThread);
                const wiggleOffset = wiggleFunction ? wiggleFunction(pos.x * 10) : 0;

                // Phase 3: Node reveal animation (fade in + scale)
                const threadProgress = revealProgress[thread.id] ?? 1;
                const nodeRevealProgress = Math.min(
                  Math.max((threadProgress - 0.3) / 0.7, 0),
                  1
                ); // Nodes appear after 30% of thread is visible
                const nodeScale = 0.3 + nodeRevealProgress * 0.7; // Scale from 0.3 to 1
                const nodeOpacity = nodeRevealProgress;

                // Phase 4: Deformation offset if this node is being dragged
                const isDraggedNode =
                  draggedNode?.threadId === thread.id && draggedNode?.nodeStep === stepIndex;
                const deformOffset = isDraggedNode ? pullOffset : { x: 0, y: 0 };

                // Phase 5: Click ripple effect state
                const isClickedNode =
                  clickedNode?.threadId === thread.id &&
                  clickedNode?.nodeStep === stepIndex;
                const rippleProgress = isClickedNode
                  ? Math.min((Date.now() - clickedNode.timestamp) / 800, 1)
                  : 0;

                // Phase 5: Hover scale effect
                const isHovered = hoveredNode === node?.cardId;
                const hoverScale = isHovered ? 1.1 : 1;

                return (
                  <g
                    key={uniqueKey}
                    transform={`translate(${pos.x * 10 + deformOffset.x}, ${yPos * 6 + wiggleOffset + deformOffset.y})`}
                    style={{ cursor: isDraggedNode ? 'grabbing' : 'grab' }}
                    onClick={() => {
                      if (!isActiveThread) {
                        setActiveThread(thread.id);
                      }
                      handleNodeClick(stepIndex, thread.id);
                    }}
                    onMouseDown={(e) => {
                      if (!isSpringBack) {
                        handleNodeDragStart(e, thread.id, stepIndex, pos.x * 10, yPos * 6 + wiggleOffset);
                      }
                    }}
                    onMouseEnter={() => setHoveredNode(node?.cardId || null)}
                    onMouseLeave={() => setHoveredNode(null)}
                    opacity={nodeOpacity}
                  >
                    {/* Phase 5: Click ripple effect */}
                    {isClickedNode && (
                      <>
                        {/* Ripple ring 1 */}
                        <circle
                          r={rippleProgress * 30}
                          fill="none"
                          stroke={threadColor}
                          strokeWidth="2"
                          opacity={(1 - rippleProgress) * 0.6}
                        />
                        {/* Ripple ring 2 - delayed */}
                        <circle
                          r={Math.max(0, (rippleProgress - 0.2) * 35)}
                          fill="none"
                          stroke={threadColor}
                          strokeWidth="1.5"
                          opacity={Math.max(0, (1 - rippleProgress) * 0.4)}
                        />
                      </>
                    )}

                    {/* Enhanced node with reveal + hover + rotation animation */}
                    <g
                      transform={`scale(${nodeScale * hoverScale}) rotate(${isHovered ? (Math.sin(time * 2) * 5) : 0})`}
                      className="transition-transform duration-300"
                    >
                      {/* Sustainability Score - above node */}
                      {node.metricsAfter && (
                        <text
                          y="-22"
                          textAnchor="middle"
                          fill={
                            node.metricsAfter.sustainabilityScore >= 70 ? '#10B981' :
                            node.metricsAfter.sustainabilityScore >= 50 ? '#FFD700' :
                            node.metricsAfter.sustainabilityScore >= 30 ? '#F97316' :
                            '#EF4444'
                          }
                          fontSize="11"
                          fontWeight="bold"
                        >
                          {Math.round(node.metricsAfter.sustainabilityScore)}
                        </text>
                      )}
                      {/* Outer glow ring */}
                      {(isCurrentStep || hoveredNode === node?.cardId) && (
                        <circle
                          r={isCurrentStep ? 24 : 20}
                          fill={isCurrentStep ? '#FFD700' : threadColor}
                          opacity="0.2"
                          filter="url(#glow)"
                          className="transition-all duration-300"
                        />
                      )}
                      {/* Main node circle */}
                      <circle
                        r={isCurrentStep ? 16 : (hoveredNode === node?.cardId ? 14 : 12)}
                        fill={isCurrentStep ? '#FFD700' : threadColor}
                        stroke={isCurrentStep ? '#FFF' : threadColor}
                        strokeWidth={isCurrentStep ? 2 : (hoveredNode === node?.cardId ? 2.5 : 2)}
                        filter={isCurrentStep || hoveredNode === node?.cardId ? 'url(#intense-glow)' : 'url(#glow)'}
                        className="transition-all duration-300"
                      />
                      {/* Inner highlight for depth */}
                      <circle
                        r={isCurrentStep ? 12 : (hoveredNode === node?.cardId ? 10 : 8)}
                        fill={isCurrentStep ? '#FFF' : threadColor}
                        opacity="0.3"
                        className="transition-all duration-300"
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
                  </g>
                );
              })}
            </g>
          );
        })}

      </svg>

      {/* Action prompt */}
      {(() => {
        // Calculate the highest step number in the current thread
        const lastStep = activeThread.nodes.length > 0
          ? Math.max(...activeThread.nodes.map(n => n.step))
          : 0;
        const isComplete = lastStep >= 10;

        if (!isComplete) {
          return (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <button
                onClick={() => setShowDecisionModal(true)}
                className="btn-primary flex items-center gap-2 shadow-glow-gold animate-pulse"
              >
                <Sparkles className="w-4 h-4" />
                Make Next Decision
              </button>
            </div>
          );
        } else {
          return (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-emerald/20 border border-emerald/50 rounded-lg px-4 py-2">
              <p className="text-sm text-emerald font-semibold">
                ✨ Timeline Complete! Click any node to review or reweave
              </p>
            </div>
          );
        }
      })()}
    </div>
  );
}
