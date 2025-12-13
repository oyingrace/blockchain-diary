import { useState } from 'react';
import { request } from '@stacks/connect';
import type { TransactionResult } from '@stacks/connect/dist/types/methods';
import { Cl } from '@stacks/transactions';
import { useWallet } from '../contexts/WalletContext';
import { CONTRACT_ADDRESS, CONTRACT_NAME, NETWORK } from '../constants';

interface AddWordProps {
  onWordAdded?: () => void;
}

export function AddWord({ onWordAdded }: AddWordProps) {
  const { isConnected } = useWallet();
  const [word, setWord] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !word.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result: TransactionResult = await request('stx_callContract', {
        contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
        functionName: 'add-word',
        functionArgs: [Cl.stringAscii(word.trim())],
        network: NETWORK,
        postConditionMode: 'deny',
        sponsored: false,
      });

      if (result) {
        setSuccess(true);
        setWord('');
        // Refresh immediately - polling will catch updates once block is mined
        onWordAdded?.();
        // Clear success message after a moment
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error('Error adding word:', err);
      setError(err instanceof Error ? err.message : 'Failed to add word');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2>Add a Word</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Enter one word..."
            maxLength={32}
            disabled={!isConnected || isLoading}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          <button
            type="submit"
            disabled={!isConnected || isLoading || !word.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: isConnected ? '#007bff' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isConnected ? 'pointer' : 'not-allowed',
            }}
          >
            {isLoading ? 'Adding...' : 'Add Word'}
          </button>
        </div>
        {!isConnected && (
          <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
            Connect your wallet to add words
          </p>
        )}
        {error && (
          <p style={{ fontSize: '0.875rem', color: '#c33', margin: '0.5rem 0 0 0' }}>
            Error: {error}
          </p>
        )}
        {success && (
          <p style={{ fontSize: '0.875rem', color: '#3c3', margin: '0.5rem 0 0 0' }}>
            Word added! Refreshing story...
          </p>
        )}
      </form>
    </section>
  );
}

