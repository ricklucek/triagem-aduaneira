"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SWRKey = string | null;

type SWRResponse<Data> = {
  data: Data | undefined;
  error: Error | undefined;
  isLoading: boolean;
  mutate: () => Promise<void>;
};

export default function useSWR<Data>(key: SWRKey, fetcher: (key: string) => Promise<Data>): SWRResponse<Data> {
  const [data, setData] = useState<Data>();
  const [error, setError] = useState<Error>();
  const [isLoading, setIsLoading] = useState(Boolean(key));
  const active = useRef(true);

  const run = useCallback(async () => {
    if (!key) return;
    setIsLoading(true);
    setError(undefined);
    try {
      const result = await fetcher(key);
      if (active.current) setData(result);
    } catch (err) {
      if (active.current) setError(err as Error);
    } finally {
      if (active.current) setIsLoading(false);
    }
  }, [fetcher, key]);

  useEffect(() => {
    active.current = true;
    void run();
    return () => {
      active.current = false;
    };
  }, [run]);

  return { data, error, isLoading, mutate: run };
}
