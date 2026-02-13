import { useState, useCallback, useRef, useEffect } from 'react';
import type { AxiosResponse } from 'axios';

export function useApi<T, Args extends any[]>(
    apiFunc: (...args: Args) => Promise<AxiosResponse<T>>,
    options: { onSuccess?: (data: T) => void; onError?: (error: any) => void } = {}
) {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    // Use refs to keep the latest functions/options without triggering re-renders or useCallback updates
    const apiFuncRef = useRef(apiFunc);
    const optionsRef = useRef(options);

    useEffect(() => {
        apiFuncRef.current = apiFunc;
    }, [apiFunc]);

    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    const execute = useCallback(async (...args: Args) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiFuncRef.current(...args);
            setData(response.data);
            optionsRef.current.onSuccess?.(response.data);
            return response.data;
        } catch (err: any) {
            setError(err);
            optionsRef.current.onError?.(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []); // Stable execute function

    return {
        data,
        isLoading,
        error,
        execute,
        setData
    };
}
