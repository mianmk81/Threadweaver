/**
 * Performance optimization utilities
 * Memoization and optimization helpers
 */

import { useMemo, useCallback } from 'react';
import type { MetricsState, TimelineThread } from '../types';

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Memoize expensive calculations
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Calculate metrics change rate (for performance monitoring)
 */
export const calculateMetricsChangeRate = memoize(
  (previous: MetricsState, current: MetricsState): number => {
    const keys: (keyof MetricsState)[] = [
      'waste',
      'emissions',
      'cost',
      'efficiency',
      'communityTrust',
      'sustainabilityScore',
    ];

    const totalChange = keys.reduce((sum, key) => {
      return sum + Math.abs(current[key] - previous[key]);
    }, 0);

    return totalChange / keys.length;
  }
);

/**
 * Check if thread needs recalculation (optimization)
 */
export function shouldRecalculateThread(
  thread: TimelineThread,
  lastCalculated: number
): boolean {
  const timeSinceUpdate = Date.now() - new Date(thread.createdAt).getTime();
  const cacheLifetime = 5 * 60 * 1000; // 5 minutes

  return timeSinceUpdate - lastCalculated > cacheLifetime;
}

/**
 * Lazy load component (code splitting helper)
 */
export function lazyLoadWithRetry<T>(
  importFn: () => Promise<{ default: T }>,
  retries = 3,
  interval = 1000
): Promise<{ default: T }> {
  return new Promise((resolve, reject) => {
    importFn()
      .then(resolve)
      .catch((error) => {
        if (retries === 0) {
          reject(error);
          return;
        }

        setTimeout(() => {
          lazyLoadWithRetry(importFn, retries - 1, interval)
            .then(resolve)
            .catch(reject);
        }, interval);
      });
  });
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(label: string) {
  const startTime = useMemo(() => performance.now(), []);

  const measure = useCallback(() => {
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }, [label, startTime]);

  return { measure };
}

/**
 * Request Animation Frame helper for smooth animations
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  callback: T
): (...args: Parameters<T>) => void {
  let requestId: number | null = null;

  return (...args: Parameters<T>) => {
    if (requestId !== null) {
      return;
    }

    requestId = requestAnimationFrame(() => {
      callback(...args);
      requestId = null;
    });
  };
}

/**
 * Memory-efficient array chunking
 */
export function* chunkArray<T>(array: T[], size: number): Generator<T[]> {
  for (let i = 0; i < array.length; i += size) {
    yield array.slice(i, i + size);
  }
}

/**
 * Deep equality check (optimized)
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (
    typeof obj1 !== 'object' ||
    typeof obj2 !== 'object' ||
    obj1 === null ||
    obj2 === null
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}
