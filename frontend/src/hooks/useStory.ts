import { useState, useEffect, useRef } from 'react';
import { fetchCallReadOnlyFunction } from '@stacks/transactions';
import { CONTRACT_ADDRESS, CONTRACT_NAME, NETWORK, API_URL } from '../constants';
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

      // Try using Stacks API REST endpoint first (easier to parse)
      try {
        const apiUrl = `${API_URL}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/get-story`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: CONTRACT_ADDRESS,
            arguments: [],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('API response:', data);
          
          // The API returns hex-encoded Clarity values, so we still need to use fetchCallReadOnlyFunction
          // But let's try both approaches
        }
      } catch (apiErr) {
        console.log('API call failed, using fetchCallReadOnlyFunction:', apiErr);
      }

      const result = await fetchCallReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'get-story',
        functionArgs: [],
        network: NETWORK,
        senderAddress: CONTRACT_ADDRESS,
      });

      // Debug: log the raw result (avoid JSON.stringify due to BigInt)
      console.log('Raw ClarityValue result:', result);
      console.log('Result type:', result?.type, 'typeName:', result?.typeName);

      // The result should be a ResponseOk containing a List
      // Structure: { type: 9, value: { type: 10, list: [...] } }

      // Parse the ClarityValue result manually
      const parsedStory = parseClarityValue(result);
      console.log('Parsed story:', parsedStory);
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
    if (!cv) {
      console.log('parseClarityValue: cv is null/undefined');
      return [];
    }

    console.log('parseClarityValue: cv type:', cv.type, 'typeName:', cv.typeName);
    console.log('parseClarityValue: cv.value:', cv.value);

    // Handle ResponseOk type (type 9, 'ok', or ResponseOk)
    if (cv.type === 9 || cv.type === 'ok' || cv.typeName === 'ResponseOk' || cv.type === 'ResponseOk') {
      console.log('Found ResponseOk/ok, unwrapping value...');
      if (cv.value) {
        return parseClarityValue(cv.value);
      }
      return [];
    }

    // Handle List type (type 10, 'list', or List)
    if (cv.type === 10 || cv.type === 'list' || cv.typeName === 'List' || cv.type === 'List') {
      console.log('Found List type');
      const list = cv.list || cv.value || [];
      console.log('List items count:', Array.isArray(list) ? list.length : 'not an array');
      console.log('List items:', list);
      
      if (!Array.isArray(list)) {
        console.log('List is not an array:', list);
        return [];
      }

      return list.map((item: any, index: number) => {
        console.log(`Parsing item ${index}:`, item);
        console.log(`Item ${index} type:`, item?.type, 'typeName:', item?.typeName);
        
        // Handle tuple - could be item.value or item itself
        let tuple = item;
        if (item && item.value) {
          tuple = item.value;
        } else if (item && (item.type === 'Tuple' || item.type === 'tuple')) {
          tuple = item.value || item.data || item;
        }

        console.log(`Item ${index} tuple:`, tuple);
        console.log(`Item ${index} tuple keys:`, tuple ? Object.keys(tuple) : 'no tuple');

        // Try different ways to access tuple fields
        const word = extractValue(tuple?.word) || extractValue(tuple?.['word']) || '';
        const sender = extractValue(tuple?.sender) || extractValue(tuple?.['sender']) || '';
        const timestamp = Number(extractValue(tuple?.timestamp) || extractValue(tuple?.['timestamp']) || 0);

        console.log(`Item ${index} parsed:`, { word, sender, timestamp });

        return { word, sender, timestamp };
      });
    }

    // If it's already an array, parse it directly
    if (Array.isArray(cv)) {
      console.log('cv is already an array');
      return cv.map((item: any) => ({
        word: extractValue(item.word) || '',
        sender: extractValue(item.sender) || '',
        timestamp: Number(extractValue(item.timestamp) || 0),
      }));
    }

    // Try to access data property
    if (cv.data && Array.isArray(cv.data)) {
      console.log('Found cv.data array');
      return parseClarityValue(cv.data);
    }

    console.log('Could not parse cv, returning empty array');
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
