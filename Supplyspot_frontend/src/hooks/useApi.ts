// Custom hooks for API calls with loading and error states

import { useState, useEffect, useCallback } from 'react';
import { ApiResponse, ListParams } from '../types';

// Generic hook for API calls
export function useApi<T>(
  apiCall: (params?: any) => Promise<ApiResponse<T>>,
  params?: any,
  immediate = true
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (executeParams?: any) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiCall(executeParams || params);
        if (response.success && response.data) {
          setData(response.data);
        } else {
          setError(response.error || 'An error occurred');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    },
    [apiCall, params]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { data, loading, error, execute, refetch: execute };
}

// Hook for paginated data
export function usePaginatedApi<T>(
  apiCall: (params: ListParams) => Promise<ApiResponse<T[]>>,
  initialParams: ListParams = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [params, setParams] = useState<ListParams>(initialParams);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall({ ...params, page: pagination.page, limit: pagination.limit });
      if (response.success) {
        setData(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setError(response.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiCall, params, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateParams = useCallback((newParams: Partial<ListParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when params change
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 })); // Reset to first page when limit changes
  }, []);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    pagination,
    params,
    updateParams,
    setPage,
    setLimit,
    refetch,
  };
}

// Hook for mutation operations (POST, PUT, DELETE)
export function useMutation<T, P = any>(
  mutationCall: (params: P) => Promise<ApiResponse<T>>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const mutate = useCallback(
    async (params: P): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await mutationCall(params);
        if (response.success && response.data) {
          setData(response.data);
          return response.data;
        } else {
          setError(response.error || 'Operation failed');
          return null;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [mutationCall]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, loading, error, data, reset };
}

// Hook for file uploads
export function useFileUpload<T>(
  uploadCall: (file: File, additionalData?: any) => Promise<ApiResponse<T>>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(
    async (file: File, additionalData?: any): Promise<T | null> => {
      setLoading(true);
      setError(null);
      setProgress(0);

      try {
        // Simulate progress (in real implementation, this would come from the upload API)
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 10, 90));
        }, 100);

        const response = await uploadCall(file, additionalData);
        
        clearInterval(progressInterval);
        setProgress(100);

        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.error || 'Upload failed');
          return null;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        return null;
      } finally {
        setLoading(false);
        setTimeout(() => setProgress(0), 1000); // Reset progress after a short delay
      }
    },
    [uploadCall]
  );

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
    setProgress(0);
  }, []);

  return { upload, loading, error, progress, reset };
}

// Hook for real-time data (WebSocket)
export function useWebSocket<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setData(parsedData);
      } catch (err) {
        setError('Failed to parse WebSocket message');
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = () => {
      setError('WebSocket connection error');
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = useCallback((message: any) => {
    if (connected) {
      const ws = new WebSocket(url);
      ws.send(JSON.stringify(message));
    }
  }, [url, connected]);

  return { data, connected, error, sendMessage };
}

// Hook for debounced API calls
export function useDebouncedApi<T>(
  apiCall: (params: any) => Promise<ApiResponse<T>>,
  delay = 300
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedCall = useCallback(
    debounce(async (params: any) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiCall(params);
        if (response.success && response.data) {
          setData(response.data);
        } else {
          setError(response.error || 'An error occurred');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }, delay),
    [apiCall, delay]
  );

  return { data, loading, error, execute: debouncedCall };
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
