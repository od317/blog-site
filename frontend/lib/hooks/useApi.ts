import { useState, useCallback } from "react";
import { formatError, FormattedError } from "@/lib/utils/errors";

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: FormattedError | null;
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setState({ data: null, isLoading: true, error: null });

    try {
      const data = await apiCall();
      setState({ data, isLoading: false, error: null });
      return { success: true, data };
    } catch (error) {
      const formattedError = formatError(error);
      setState({ data: null, isLoading: false, error: formattedError });
      return { success: false, error: formattedError };
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
