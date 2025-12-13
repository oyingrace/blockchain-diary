import { useState, useEffect, useRef } from 'react';
import { fetchCallReadOnlyFunction } from '@stacks/transactions';
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

      const result = await fetchCallReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'get-story',
        functionArgs: [],
        network: NETWORK,
        senderAddress: CONTRACT_ADDRESS,
      });

      // Parse the ClarityValue result
      const parsedStory = parseClarityValue(result);
      setStory(parsedStory);
      isInitialLoadRef.current = false;
    } catch (err) {
      console.error('Error fetching story:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch story');
      setStory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseClarityValue = (cv: any): StoryEntry[] => {
    if (!cv) return [];

    // Handle ResponseOk type (type 9)
    if (cv.type === 9 || cv.typeName === 'ResponseOk') {
      return parseClarityValue(cv.value);
    }

    // Handle List type (type 10)
    if (cv.type === 10 || cv.typeName === 'List') {
      const list = cv.list || [];
      return list.map((item: any) => {
        // Each item is a tuple
        const tuple = item.value || item;
        return {
          word: extractValue(tuple.word) || '',
          sender: extractValue(tuple.sender) || '',
          timestamp: Number(extractValue(tuple.timestamp) || 0),
        };
      });
    }

    // If it's already an array, parse it directly
    if (Array.isArray(cv)) {
      return cv.map((item: any) => ({
        word: extractValue(item.word) || '',
        sender: extractValue(item.sender) || '',
        timestamp: Number(extractValue(item.timestamp) || 0),
      }));
    }

    return [];
  };

  const extractValue = (value: any): string | number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (value.value !== undefined) return value.value;
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
