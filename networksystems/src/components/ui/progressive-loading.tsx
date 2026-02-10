/**
 * Progressive Loading Patterns
 * Incremental content loading for better perceived performance
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';
import { AriaHelpers } from '@/lib/accessibility';

/**
 * Progressive loading hook
 * Loads items in batches for better performance
 */
export function useProgressiveLoad<T>(
  items: T[],
  batchSize: number = 10,
  delay: number = 100
) {
  const [loadedCount, setLoadedCount] = useState(batchSize);
  const [isLoading, setIsLoading] = useState(items.length > batchSize);

  useEffect(() => {
    if (loadedCount >= items.length) {
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setLoadedCount((prev) => Math.min(prev + batchSize, items.length));
    }, delay);

    return () => clearTimeout(timer);
  }, [loadedCount, items.length, batchSize, delay]);

  return {
    visibleItems: items.slice(0, loadedCount),
    isLoading,
    loadedCount,
    totalCount: items.length,
    hasMore: loadedCount < items.length,
  };
}

/**
 * Intersection observer hook for lazy loading
 */
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback();
        }
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [callback, options]);

  return targetRef;
}

/**
 * Progressive list component
 * Loads items incrementally as user scrolls
 */
export function ProgressiveList<T>({
  items,
  renderItem,
  batchSize = 20,
  delay = 100,
  loadingComponent,
  emptyComponent,
  className,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  batchSize?: number;
  delay?: number;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  className?: string;
}) {
  const { visibleItems, isLoading, hasMore, loadedCount, totalCount } = useProgressiveLoad(
    items,
    batchSize,
    delay
  );

  if (items.length === 0 && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  return (
    <div className={className} {...AriaHelpers.loading(isLoading)}>
      <div className="space-y-4">
        {visibleItems.map((item, index) => (
          <div key={index}>{renderItem(item, index)}</div>
        ))}
      </div>

      {isLoading && (
        <div className="mt-4" role="status" aria-live="polite">
          {loadingComponent || <Skeleton className="h-20 w-full" />}
          <span className="sr-only">
            Loading more items... {loadedCount} of {totalCount} loaded
          </span>
        </div>
      )}

      {hasMore && !isLoading && (
        <div className="text-center mt-4 text-sm text-zinc-500">
          Showing {loadedCount} of {totalCount} items
        </div>
      )}
    </div>
  );
}

/**
 * Infinite scroll component
 */
export function InfiniteScroll({
  children,
  onLoadMore,
  hasMore,
  isLoading,
  loadingComponent,
  threshold = 0.8,
  className,
}: {
  children: React.ReactNode;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  loadingComponent?: React.ReactNode;
  threshold?: number;
  className?: string;
}) {
  const sentinelRef = useIntersectionObserver(
    () => {
      if (hasMore && !isLoading) {
        onLoadMore();
      }
    },
    { threshold }
  );

  return (
    <div className={className} {...AriaHelpers.loading(isLoading)}>
      {children}

      {hasMore && (
        <div ref={sentinelRef} className="py-4">
          {isLoading && (
            <div role="status" aria-live="polite">
              {loadingComponent || <Skeleton className="h-20 w-full" />}
              <span className="sr-only">Loading more content...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Staggered reveal animation
 * Items appear one after another with delay
 */
export function StaggeredReveal({
  children,
  delay = 100,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const [visibleIndex, setVisibleIndex] = useState(-1);
  const childrenArray = Array.isArray(children) ? children : [children];

  useEffect(() => {
    if (visibleIndex >= childrenArray.length - 1) return;

    const timer = setTimeout(() => {
      setVisibleIndex((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [visibleIndex, childrenArray.length, delay]);

  return (
    <div className={className}>
      {childrenArray.map((child, index) => (
        <div
          key={index}
          className={cn(
            'transition-all duration-500',
            index <= visibleIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

/**
 * Fade in when visible
 */
export function FadeInWhenVisible({
  children,
  threshold = 0.1,
  className,
}: {
  children: React.ReactNode;
  threshold?: number;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useIntersectionObserver(() => setIsVisible(true), { threshold });

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Load more button
 */
export function LoadMoreButton({
  onLoadMore,
  isLoading,
  hasMore,
  loadedCount,
  totalCount,
  className,
}: {
  onLoadMore: () => void;
  isLoading: boolean;
  hasMore: boolean;
  loadedCount: number;
  totalCount: number;
  className?: string;
}) {
  if (!hasMore) {
    return (
      <div className="text-center py-4 text-sm text-zinc-500">
        Showing all {totalCount} items
      </div>
    );
  }

  return (
    <div className={cn('text-center py-4', className)}>
      <button
        onClick={onLoadMore}
        disabled={isLoading}
        className={cn(
          'px-6 py-3 rounded-lg font-light transition-colors',
          isLoading
            ? 'bg-zinc-400 text-white cursor-not-allowed'
            : 'bg-emerald-600 text-white hover:bg-emerald-700'
        )}
        {...AriaHelpers.disabled(isLoading)}
      >
        {isLoading ? 'Loading...' : `Load More (${loadedCount} of ${totalCount})`}
      </button>
    </div>
  );
}

/**
 * Optimistic update wrapper
 * Shows optimistic state while waiting for server response
 */
export function OptimisticUpdate<T>({
  data,
  optimisticData,
  isUpdating,
  renderData,
  renderOptimistic,
  className,
}: {
  data: T;
  optimisticData: T | null;
  isUpdating: boolean;
  renderData: (data: T) => React.ReactNode;
  renderOptimistic?: (data: T) => React.ReactNode;
  className?: string;
}) {
  const displayData = isUpdating && optimisticData ? optimisticData : data;
  const renderFn = isUpdating && optimisticData && renderOptimistic ? renderOptimistic : renderData;

  return (
    <div
      className={cn(isUpdating && 'opacity-75 pointer-events-none transition-opacity', className)}
      {...AriaHelpers.loading(isUpdating)}
    >
      {renderFn(displayData)}
      {isUpdating && <span className="sr-only">Updating...</span>}
    </div>
  );
}

/**
 * Skeleton to content transition
 */
export function SkeletonTransition({
  isLoading,
  skeleton,
  children,
  className,
}: {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className} {...AriaHelpers.loading(isLoading)}>
      <div
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
        )}
      >
        {skeleton}
      </div>
      <div
        className={cn(
          'transition-opacity duration-300',
          !isLoading ? 'opacity-100' : 'opacity-0'
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Chunked data loader
 * Loads large datasets in chunks to avoid blocking UI
 */
export function useChunkedData<T>(
  data: T[],
  chunkSize: number = 50,
  processDelay: number = 16 // ~60fps
) {
  const [processedData, setProcessedData] = useState<T[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (data.length === 0) {
      setProcessedData([]);
      setProgress(100);
      return;
    }

    setIsProcessing(true);
    let currentIndex = 0;

    const processChunk = () => {
      const chunk = data.slice(currentIndex, currentIndex + chunkSize);
      setProcessedData((prev) => [...prev, ...chunk]);

      currentIndex += chunkSize;
      setProgress((currentIndex / data.length) * 100);

      if (currentIndex < data.length) {
        setTimeout(processChunk, processDelay);
      } else {
        setIsProcessing(false);
      }
    };

    processChunk();
  }, [data, chunkSize, processDelay]);

  return {
    data: processedData,
    isProcessing,
    progress: Math.min(progress, 100),
  };
}

/**
 * Progress bar for chunked loading
 */
export function LoadingProgressBar({
  progress,
  className,
}: {
  progress: number;
  className?: string;
}) {
  return (
    <div className={cn('w-full bg-zinc-200 rounded-full h-2 overflow-hidden', className)}>
      <div
        className="h-full bg-emerald-600 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="sr-only">{Math.round(progress)}% loaded</span>
      </div>
    </div>
  );
}

/**
 * Placeholder content while loading
 * Maintains layout to prevent CLS (Cumulative Layout Shift)
 */
export function PlaceholderContent({
  isLoading,
  placeholder,
  children,
  minHeight,
  className,
}: {
  isLoading: boolean;
  placeholder: React.ReactNode;
  children: React.ReactNode;
  minHeight?: string | number;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{ minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight }}
      {...AriaHelpers.loading(isLoading)}
    >
      {isLoading ? placeholder : children}
    </div>
  );
}

/**
 * Export all progressive loading components
 */
export const ProgressiveLoading = {
  List: ProgressiveList,
  InfiniteScroll,
  StaggeredReveal,
  FadeInWhenVisible,
  LoadMoreButton,
  OptimisticUpdate,
  SkeletonTransition,
  ProgressBar: LoadingProgressBar,
  Placeholder: PlaceholderContent,
  useProgressiveLoad,
  useIntersectionObserver,
  useChunkedData,
};

export default ProgressiveList;
