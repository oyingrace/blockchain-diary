import { useWallet } from '../contexts/WalletContext';
import { calculateStreak } from '../utils/streak';
import type { StoryEntry } from '../types';
import './StreakDisplay.css';

interface StreakDisplayProps {
  story: StoryEntry[];
}

export function StreakDisplay({ story }: StreakDisplayProps) {
  const { address } = useWallet();
  const streak = calculateStreak(story, address);

  if (!address) {
    return null;
  }

  return (
    <section className="streak-section">
      <div className="streak-display">
        <span className="streak-label">Your streak:</span>
        <span className="streak-value">{streak}</span>
        <span className="streak-unit">{streak === 1 ? 'day' : 'days'}</span>
      </div>
    </section>
  );
}

