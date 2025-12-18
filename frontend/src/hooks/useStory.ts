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



export type {
  ChainhookDefinitionSchema,
  ChainhookStatusSchema,
  EvaluateChainhookRequest,
  BulkEnableChainhooksRequest,
};

const POLL_INTERVAL = 30000; // 30 seconds - increased to reduce API calls
const API_DELAY_MS = 1000; // 1 second delay between API calls to stay under per-minute rate limits
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const RATE_LIMIT_WAIT_MS = 30000; // 30 seconds wait for per-minute rate limits

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to retry with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  initialDelay: number = INITIAL_RETRY_DELAY
): Promise<T> => {
  let lastError: Error | unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error (429) or network error
      // The error might be in different formats:
      // - error.status === 429
      // - error.message includes '429' or 'Too Many Requests'
      // - error is a Response object with status 429
      // - Network errors that might be rate limiting
      // - Per-minute rate limit errors from Hiro API
      const errorMessage = error?.message || error?.toString() || '';
      const errorStatus = error?.status || error?.response?.status;
      const isPerMinuteRateLimit = errorMessage.includes('Per-minute rate limit') || 
                                   errorMessage.includes('rate limit exceeded');
      const isRateLimit = errorStatus === 429 || 
                         errorMessage.includes('429') ||
                         errorMessage.includes('Too Many Requests') ||
                         isPerMinuteRateLimit ||
                         (errorMessage.includes('Failed to fetch') && attempt === 0); // Only retry network errors on first attempt
      
      if (isRateLimit && attempt < maxRetries) {
        // For per-minute rate limits, wait longer (30 seconds)
        // Otherwise use exponential backoff
        let delayMs: number;
        if (isPerMinuteRateLimit) {
          delayMs = RATE_LIMIT_WAIT_MS;
          console.warn(`Per-minute rate limit exceeded. Waiting ${delayMs / 1000} seconds before retry (attempt ${attempt + 1}/${maxRetries + 1})`);
        } else {
          delayMs = initialDelay * Math.pow(2, attempt);
          console.warn(`Rate limit hit, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        }
        await delay(delayMs);
        continue;
      }
      
      // If not a rate limit error or max retries reached, throw
      throw error;
    }
  }
  
  throw lastError;
};

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

      // 1) Get total number of words from story-v2 with retry logic
      const countResult = await retryWithBackoff(async () => {
        return await fetchCallReadOnlyFunction({
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'get-word-count',
          functionArgs: [],
          network: NETWORK,
          senderAddress: CONTRACT_ADDRESS,
        });
      });

      const countInner = extractOkInner(countResult);
      const rawCount = extractValue(countInner);
      const count = typeof rawCount === 'number' ? rawCount : Number(rawCount || 0);

      if (!count || count <= 0) {
        setStory([]);
        isInitialLoadRef.current = false;
        return;
      }

      // 2) Fetch each word by id: [0 .. count-1] with delays and retry logic
      const entries: StoryEntry[] = [];

      for (let id = 0; id < count; id++) {
        // Add delay between requests to avoid rate limiting
        if (id > 0) {
          await delay(API_DELAY_MS);
        }

        const wordResult = await retryWithBackoff(async () => {
          return await fetchCallReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-word',
            functionArgs: [Cl.uint(id)],
            network: NETWORK,
            senderAddress: CONTRACT_ADDRESS,
          });
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
      let errorMessage = err instanceof Error ? err.message : 'Failed to fetch story';
      
      // Provide user-friendly error messages for rate limits
      if (errorMessage.includes('Per-minute rate limit') || errorMessage.includes('rate limit exceeded')) {
        errorMessage = 'API rate limit exceeded. Please wait a moment and try again. Consider upgrading your Hiro API plan if this persists.';
      } else if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      }
      
      setError(errorMessage);
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
