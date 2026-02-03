/**
 * React hooks for API calls
 * Provides loading, error, and data state management
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ApiClientError } from './client';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiClientError | null;
}

interface UseApiResult<T> extends UseApiState<T> {
  execute: () => Promise<T | null>;
  reset: () => void;
}

interface UseMutationResult<T, V> {
  data: T | null;
  isLoading: boolean;
  error: ApiClientError | null;
  mutate: (variables: V) => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook for API calls that should run on mount or manually
 */
export function useApi<T>(
  apiCall: () => Promise<T>,
  options: { immediate?: boolean } = {}
): UseApiResult<T> {
  const { immediate = false } = options;
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: immediate,
    error: null,
  });

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const execute = useCallback(async (): Promise<T | null> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await apiCall();
      if (isMounted.current) {
        setState({ data, isLoading: false, error: null });
      }
      return data;
    } catch (err) {
      const error =
        err instanceof ApiClientError
          ? err
          : new ApiClientError(500, {
              code: 'UNKNOWN_ERROR',
              message: err instanceof Error ? err.message : 'Unknown error',
            });

      if (isMounted.current) {
        setState({ data: null, isLoading: false, error });
      }
      return null;
    }
  }, [apiCall]);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return { ...state, execute, reset };
}

/**
 * Hook for mutation operations (POST, PUT, PATCH, DELETE)
 */
export function useMutation<T, V = void>(
  mutationFn: (variables: V) => Promise<T>
): UseMutationResult<T, V> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const mutate = useCallback(
    async (variables: V): Promise<T | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await mutationFn(variables);
        if (isMounted.current) {
          setState({ data, isLoading: false, error: null });
        }
        return data;
      } catch (err) {
        const error =
          err instanceof ApiClientError
            ? err
            : new ApiClientError(500, {
                code: 'UNKNOWN_ERROR',
                message: err instanceof Error ? err.message : 'Unknown error',
              });

        if (isMounted.current) {
          setState({ data: null, isLoading: false, error });
        }
        return null;
      }
    },
    [mutationFn]
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return { ...state, mutate, reset };
}
