import { useState } from 'react';
import { request } from '@stacks/connect';
import type { TransactionResult } from '@stacks/connect/dist/types/methods';
import { Cl } from '@stacks/transactions';
import { useWallet } from '../contexts/WalletContext';
import { CONTRACT_ADDRESS, CONTRACT_NAME, NETWORK } from '../constants';
import './AddWord.css';

interface AddWordProps {
  onWordAdded?: () => void;
}

export function AddWord({ onWordAdded }: AddWordProps) {
  const { isConnected } = useWallet();
  const [word, setWord] = useState('');
  const [category, setCategory] = useState('general');
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
        functionArgs: [
          Cl.stringAscii(word.trim()),
          // Allow empty/whitespace category to fall back to DEFAULT-CATEGORY on-chain
          Cl.stringAscii(category.trim()),
        ],
        network: NETWORK,
        postConditionMode: 'deny',
        sponsored: false,
      });

      if (result) {
        setSuccess(true);
        setWord('');
        setCategory('general');
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
    <section className="add-word-section">
      <h2>Add a Word</h2>
      <form onSubmit={handleSubmit} className="add-word-form">
        <div className="input-group">
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Enter one word..."
            maxLength={32}
            disabled={!isConnected || isLoading}
            className="word-input"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={!isConnected || isLoading}
            className="category-select"
          >
            <option value="general">general</option>
            <option value="tech">tech</option>
            <option value="fun">fun</option>
            <option value="poetry">poetry</option>
          </select>
          <button
            type="submit"
            disabled={!isConnected || isLoading || !word.trim()}
            className="btn-primary btn-submit"
          >
            {isLoading ? 'Adding...' : 'Add Word'}
          </button>
        </div>
        {!isConnected && (
          <p className="form-hint">
            Connect your wallet to add words
          </p>
        )}
        {error && (
          <p className="form-error">
            Error: {error}
          </p>
        )}
        {success && (
          <p className="form-success">
            Word added! Refreshing story...
          </p>
        )}
      </form>
    </section>
  );
}
