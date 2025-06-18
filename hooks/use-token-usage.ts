'use client';

import { useState, useCallback } from 'react';

export interface TokenUsageData {
  promptTokens: number;
  completionTokens: number;
  totalTokens?: number;
}

export function useTokenUsage() {
  const [usageByMessageId, setUsageByMessageId] = useState<
    Map<string, TokenUsageData>
  >(new Map());

  const storeUsage = useCallback((messageId: string, usage: TokenUsageData) => {
    setUsageByMessageId((prev) => {
      const newMap = new Map(prev);
      newMap.set(messageId, usage);
      return newMap;
    });
  }, []);

  const getUsage = useCallback(
    (messageId: string): TokenUsageData | undefined => {
      return usageByMessageId.get(messageId);
    },
    [usageByMessageId],
  );

  const clearUsage = useCallback(() => {
    setUsageByMessageId(new Map());
  }, []);

  return {
    storeUsage,
    getUsage,
    clearUsage,
  };
}
