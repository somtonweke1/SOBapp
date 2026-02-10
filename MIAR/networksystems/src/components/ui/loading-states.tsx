import React from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';

/**
 * Consistent loading state components for the platform
 * Improves UX consistency and reduces code duplication
 */

interface LoadingProps {
  message?: string;
}

/**
 * Full-page loading spinner with optional message
 * Use for major page loads or heavy operations
 */
export const FullPageLoader: React.FC<LoadingProps> = ({ message = 'Loading...' }) => (
  <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"
           role="status"
           aria-label={message}>
      </div>
      <p className="text-lg font-light text-zinc-600">{message}</p>
    </div>
  </div>
);

/**
 * Inline loading spinner
 * Use for content sections or embedded components
 */
export const InlineLoader: React.FC<LoadingProps> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12" role="status" aria-label={message || 'Loading'}>
    <RefreshCw className="h-8 w-8 animate-spin text-zinc-400 mb-2" aria-hidden="true" />
    {message && <p className="text-sm text-zinc-500 mt-2">{message}</p>}
  </div>
);

/**
 * Small inline spinner
 * Use for buttons or compact spaces
 */
export const SmallLoader: React.FC = () => (
  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
);

/**
 * Skeleton loading card
 * Use for list items or card grids
 */
export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="animate-pulse bg-zinc-200 rounded-lg h-32" aria-hidden="true"></div>
    ))}
  </>
);

/**
 * Skeleton table rows
 * Use for table loading states
 */
export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-2" aria-hidden="true">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: cols }).map((_, colIndex) => (
          <div key={colIndex} className="flex-1 h-8 bg-zinc-200 rounded animate-pulse"></div>
        ))}
      </div>
    ))}
  </div>
);

/**
 * Loading overlay for existing content
 * Use when updating existing data
 */
export const LoadingOverlay: React.FC<LoadingProps> = ({ message = 'Updating...' }) => (
  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50"
       role="status"
       aria-label={message}>
    <div className="text-center">
      <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-2" aria-hidden="true" />
      <p className="text-sm font-medium text-zinc-700">{message}</p>
    </div>
  </div>
);
