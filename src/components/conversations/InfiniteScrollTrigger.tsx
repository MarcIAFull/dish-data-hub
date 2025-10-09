import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollTriggerProps {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}

export function InfiniteScrollTrigger({ 
  onLoadMore, 
  hasMore, 
  loading 
}: InfiniteScrollTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (triggerRef.current) {
      observer.observe(triggerRef.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, hasMore, loading]);

  if (!hasMore) return null;

  return (
    <div ref={triggerRef} className="flex justify-center py-4">
      {loading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
    </div>
  );
}
