import { useState, useEffect, useCallback } from 'react';
import * as openingsApi from '../api/openings';
import { useApi } from '../../../hooks/useApi';

export const useOpenings = (initialFilters = { job_type: '', experience_level: '' }) => {
    const [filters, setFilters] = useState(initialFilters);

    const {
        data: openings,
        isLoading: loading,
        execute: executeFetch
    } = useApi(openingsApi.getOpenings);

    const fetchOpenings = useCallback(async () => {
        await executeFetch(filters);
    }, [filters, executeFetch]);

    useEffect(() => {
        fetchOpenings();
    }, [fetchOpenings]);

    return {
        openings: openings || [],
        loading,
        filters,
        setFilters,
        fetchOpenings
    };
};
