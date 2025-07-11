import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for infinite scrolling functionality
 * Provides progressive loading like Twitter/Facebook
 */
export const useInfiniteScroll = ({
  threshold = 200, // Distance from bottom to trigger load
  enabled = true,
  onLoadMore,
  loading = false,
  hasMore = true
}) => {
  const [isNearBottom, setIsNearBottom] = useState(false);
  const triggerRef = useRef(null);
  const observerRef = useRef(null);

  // Handle scroll-based infinite loading
  const handleScroll = useCallback(() => {
    if (!enabled || loading || !hasMore) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const isNear = distanceFromBottom <= threshold;
    
    setIsNearBottom(isNear);

    if (isNear && onLoadMore) {
      onLoadMore();
    }
  }, [enabled, loading, hasMore, threshold, onLoadMore]);

  // Throttled scroll handler
  const throttledHandleScroll = useCallback(() => {
    let ticking = false;
    if (!ticking) {
      requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, [handleScroll]);

  // Intersection Observer for trigger element (more efficient than scroll)
  const setupIntersectionObserver = useCallback(() => {
    if (!triggerRef.current || !enabled) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading && onLoadMore) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: `${threshold}px`,
        threshold: 0.1
      }
    );

    observerRef.current.observe(triggerRef.current);
  }, [enabled, hasMore, loading, onLoadMore, threshold]);

  // Set up scroll listener
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [enabled, throttledHandleScroll]);

  // Set up intersection observer
  useEffect(() => {
    setupIntersectionObserver();
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [setupIntersectionObserver]);

  return {
    triggerRef,
    isNearBottom,
    isLoading: loading
  };
};
