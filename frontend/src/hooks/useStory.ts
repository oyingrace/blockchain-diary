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
      // Structure: { type: 'ok', value: { type: 'list', list: [...] } }
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

    // Handle ResponseOk type (type 9, 'ok', or ResponseOk)
    if (cv.type === 9 || cv.type === 'ok' || cv.typeName === 'ResponseOk' || cv.type === 'ResponseOk') {
      if (cv.value) {
        return parseClarityValue(cv.value);
      }
      return [];
    }

    // Handle List type (type 10, 'list', or List)
    if (cv.type === 10 || cv.type === 'list' || cv.typeName === 'List' || cv.type === 'List') {
      const list = cv.list || cv.value || [];
      
      if (!Array.isArray(list)) {
        return [];
      }

      return list.map((item: any) => {
        // Handle tuple - could be item.value or item itself
        let tuple = item;
        if (item && item.value) {
          tuple = item.value;
        } else if (item && (item.type === 'Tuple' || item.type === 'tuple')) {
          tuple = item.value || item.data || item;
        }

        // Extract tuple fields
        const word = extractValue(tuple?.word) || extractValue(tuple?.['word']) || '';
        const sender = extractValue(tuple?.sender) || extractValue(tuple?.['sender']) || '';
        const timestamp = Number(extractValue(tuple?.timestamp) || extractValue(tuple?.['timestamp']) || 0);

        return { word, sender, timestamp };
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

    // Try to access data property
    if (cv.data && Array.isArray(cv.data)) {
      return parseClarityValue(cv.data);
    }

    return [];
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
