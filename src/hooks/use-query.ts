'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';

/**
 * A lightweight client-side data-fetching hook.
 *
 * @param fetchFn  An async function that returns data (server action call)
 * @param deps     Dependency list — refetches when these change
 * @returns        { data, isLoading, error, refetch }
 */
export function useQuery<T>(
    fetchFn: (() => Promise<T>) | null,
    deps: any[] = [],
): { data: T | null; isLoading: boolean; error: Error | null; refetch: () => void } {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchFnRef = React.useRef(fetchFn);
    const dataRef = React.useRef<T | null>(data);
    const mountedRef = React.useRef<boolean>(true);

    React.useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Update refs when values change, but don't trigger effect
    React.useEffect(() => {
        fetchFnRef.current = fetchFn;
    }, [fetchFn]);

    React.useEffect(() => {
        dataRef.current = data;
    }, [data]);

    const stringifiedDeps = JSON.stringify(deps);

    const refetch = useCallback(() => {
        const currentFetch = fetchFnRef.current;
        if (!currentFetch) {
            setData(null);
            setIsLoading(false);
            return;
        }

        // Only show loading state if we don't have data yet
        if (!dataRef.current) {
            setIsLoading(true);
        }
        setError(null);

        currentFetch()
            .then((result) => {
                if (!mountedRef.current) return;
                setData(result);
                setError(null);
            })
            .catch((err) => {
                if (!mountedRef.current) return;
                setError(err instanceof Error ? err : new Error(String(err)));
            })
            .finally(() => {
                if (!mountedRef.current) return;
                setIsLoading(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stringifiedDeps]); 

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
}
