import { useRef, useCallback, useEffect } from 'react';
import * as feedApi from '../api/feed';
import { useApi } from '../../../hooks/useApi';

export const useFeed = () => {
    const cursorRef = useRef<string | null>(null);

    const {
        data: feedItems,
        isLoading: loading,
        error,
        execute: executeFetch,
        setData: setFeedItems
    } = useApi(feedApi.getFeed);

    const {
        isLoading: loadingMore,
        execute: executeFetchMore
    } = useApi(feedApi.getFeed);

    const fetchFeed = useCallback(async (isLoadMore = false) => {
        try {
            const limit = 20;
            const cursor = isLoadMore ? cursorRef.current : null;

            if (isLoadMore) {
                const items = await executeFetchMore(limit, cursor);
                if (items) {
                    setFeedItems(prev => [...(prev || []), ...items]);
                    if (items.length > 0) {
                        cursorRef.current = items[items.length - 1].created_at;
                    }
                }
            } else {
                const items = await executeFetch(limit, cursor);
                if (items && items.length > 0) {
                    cursorRef.current = items[items.length - 1].created_at;
                }
            }
        } catch (err) {
            console.error('Failed to fetch feed', err);
        }
    }, [executeFetch, executeFetchMore, setFeedItems]);

    useEffect(() => {
        fetchFeed();
    }, [fetchFeed]);

    const hasMore = (feedItems?.length || 0) > 0 && (feedItems?.length || 0) % 20 === 0;

    const loadMore = useCallback(() => {
        if (hasMore && !loading && !loadingMore && !error) {
            fetchFeed(true);
        }
    }, [hasMore, loading, loadingMore, error, fetchFeed]);

    return {
        feedItems: feedItems || [],
        setFeedItems,
        loading,
        loadingMore,
        hasMore,
        error: error ? 'Failed to load posts' : null,
        fetchFeed,
        loadMore
    };
};
