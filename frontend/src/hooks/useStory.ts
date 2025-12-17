import type {
  ChainhookDefinitionSchema,      // Chainhooks configuration
  ChainhookStatusSchema,           // Status and activity info
  EvaluateChainhookRequest,        // Evaluation parameters
  BulkEnableChainhooksRequest,     // Bulk operation filters
} from '@hirosystems/chainhooks-client';

import { useState, useEffect, useRef } from 'react';
import { fetchCallReadOnlyFunction, Cl } from '@stacks/transactions';
import { CONTRACT_ADDRESS, CONTRACT_NAME, NETWORK } from '../constants';
import type { StoryEntry } from '../types';

const POLL_INTERVAL = 10000; // 10 seconds

export function useStory() {
  const [story, setStory] = useState<StoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  const fetchStory = async (showLoading = false) => {
    try {
      if (showLoading || isInitialLoadRef.current) {
        setIsLoading(true);
      }
      setError(null);

      // 1) Get total number of words from story-v2
      const countResult = await fetchCallReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'get-word-count',
        functionArgs: [],
        network: NETWORK,
        senderAddress: CONTRACT_ADDRESS,
      });

      const countInner = extractOkInner(countResult);
      const rawCount = extractValue(countInner);
      const count = typeof rawCount === 'number' ? rawCount : Number(rawCount || 0);

      if (!count || count <= 0) {
        setStory([]);
        isInitialLoadRef.current = false;
        return;
      }

      // 2) Fetch each word by id: [0 .. count-1]
      const entries: StoryEntry[] = [];

      for (let id = 0; id < count; id++) {
        const wordResult = await fetchCallReadOnlyFunction({
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'get-word',
        functionArgs: [Cl.uint(id)],
          network: NETWORK,
          senderAddress: CONTRACT_ADDRESS,
        });

        const wordInner = extractOkInner(wordResult);
        if (!wordInner) continue;

        const tuple = wordInner.value || wordInner.data || wordInner;

        const wordValue = extractValue(tuple?.word) ?? extractValue(tuple?.['word']) ?? '';
        const senderValue = extractValue(tuple?.sender) ?? extractValue(tuple?.['sender']) ?? '';
        const timestampValue = extractValue(tuple?.timestamp) ?? extractValue(tuple?.['timestamp']) ?? 0;
        const categoryValue = extractValue(tuple?.category) ?? extractValue(tuple?.['category']) ?? '';

        entries.push({
          id,
          word: String(wordValue),
          sender: String(senderValue),
          timestamp: Number(timestampValue),
          category: String(categoryValue || ''),
        });
      }

      setStory(entries);
      isInitialLoadRef.current = false;
    } catch (err) {
      console.error('Error fetching story:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch story');
      setStory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const extractOkInner = (cv: any): any => {
    if (!cv) return [];

    if (cv.type === 9 || cv.type === 'ok' || cv.typeName === 'ResponseOk' || cv.type === 'ResponseOk') {
      return cv.value;
    }

    if (cv.value && (cv.value.type === 9 || cv.value.type === 'ok' || cv.value.typeName === 'ResponseOk')) {
      return cv.value.value;
    }

    return cv;
  };

  const extractValue = (value: any): string | number | null => {
    if (value === null || value === undefined) return null;
    
    // Handle BigInt - convert to number
    if (typeof value === 'bigint') {
      return Number(value);
    }
    
    // If it's already a primitive, return it
    if (typeof value === 'string' || typeof value === 'number') return value;
    
    // Try different possible structures
    if (value.value !== undefined) {
      const val = value.value;
      // Handle BigInt in nested values
      if (typeof val === 'bigint') return Number(val);
      return val;
    }
    if (value.data !== undefined) {
      const val = value.data;
      if (typeof val === 'bigint') return Number(val);
      return val;
    }
    if (value.type === 'stringAscii' && value.value !== undefined) {
      return value.value;
    }
    if (value.type === 'principal' && value.value !== undefined) {
      return value.value;
    }
    if (value.type === 'uint' && value.value !== undefined) {
      const val = value.value;
      if (typeof val === 'bigint') return Number(val);
      return val;
    }
    
    // If it's an object with a single property, try that
    const keys = Object.keys(value);
    if (keys.length === 1 && keys[0] !== 'type' && keys[0] !== 'typeName') {
      const val = value[keys[0]];
      if (typeof val === 'bigint') return Number(val);
      return val;
    }
    
    return null;
  };

  useEffect(() => {
    // Initial fetch
    fetchStory();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(() => {
      fetchStory(false); // Don't show loading state on polls
    }, POLL_INTERVAL);

    // Cleanup interval on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const refetch = () => {
    fetchStory(true); // Show loading state on manual refresh
  };

  return { story, isLoading, error, refetch };
}
