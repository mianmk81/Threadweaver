/**
 * LoadingSpinner - Animated loading indicator
 */

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export default function LoadingSpinner({
  size = 'md',
  className = '',
  label,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`} role="status">
      <Loader2
        className={`${sizeClasses[size]} animate-spin text-gold`}
        aria-hidden="true"
      />
      {label && <span className="text-sm text-gray-400">{label}</span>}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Full-page loading overlay
 */
export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="card-cosmic text-center">
        <LoadingSpinner size="lg" className="justify-center mb-4" />
        <p className="text-gray-300">{message}</p>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for content placeholders
 */
export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse bg-cosmic-slate rounded ${className}`}
      role="status"
      aria-label="Loading content"
      {...props}
    />
  );
}
