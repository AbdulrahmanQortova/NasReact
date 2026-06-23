// src/components/ui/InfiniteScroll.jsx
import { useEffect, useRef, useCallback } from 'react';
import './InfiniteScroll.css';

export default function InfiniteScroll({ 
  children, 
  hasMore, 
  loading, 
  onLoadMore,
  loader,
  endMessage 
}) {
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const isLoadingRef = useRef(false);

  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !loading && !isLoadingRef.current) {
      isLoadingRef.current = true;
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  useEffect(() => {
    // Reset loading ref when loading state changes to false
    if (!loading) {
      isLoadingRef.current = false;
    }
  }, [loading]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '50px', // Increased margin for better UX
      threshold: 0.1,
    });

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [handleObserver]);

  return (
    <>
      {children}
      
      {/* Sentinel element for detecting scroll end */}
      <div ref={sentinelRef} className="infinite-scroll-sentinel" />
      
      {/* Loading indicator */}
      {loading && (
        <div className="infinite-scroll-loader">
          {loader || <div className="spinner-small"></div>}
        </div>
      )}
      
      {/* End message */}
      {!hasMore && !loading && (
        <div className="infinite-scroll-end">
          {endMessage || <span>No more courses to load</span>}
        </div>
      )}
    </>
  );
}