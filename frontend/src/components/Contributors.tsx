import type { StoryEntry } from '../types';
import './Contributors.css';

interface Contributor {
  address: string;
  count: number;
  firstContribution: number;
}

interface ContributorsProps {
  story: StoryEntry[];
  isLoading?: boolean;
}

export function Contributors({ story, isLoading }: ContributorsProps) {
  if (isLoading) {
    return (
      <section className="contributors-section">
        <h2>Contributors</h2>
        <div className="contributors-loading">
          <p>Loading contributors...</p>
        </div>
      </section>
    );
  }

  // Calculate unique contributors and their contribution counts
  const contributorsMap = new Map<string, { count: number; firstContribution: number }>();
  
  story.forEach((entry) => {
    const existing = contributorsMap.get(entry.sender);
    if (existing) {
      existing.count++;
      // Keep track of earliest contribution timestamp
      if (entry.timestamp < existing.firstContribution) {
        existing.firstContribution = entry.timestamp;
      }
    } else {
      contributorsMap.set(entry.sender, {
        count: 1,
        firstContribution: entry.timestamp,
      });
    }
  });

  const contributors: Contributor[] = Array.from(contributorsMap.entries()).map(
    ([address, data]) => ({
      address,
      count: data.count,
      firstContribution: data.firstContribution,
    })
  );

  // Sort by contribution count (descending)
  contributors.sort((a, b) => b.count - a.count);

  if (contributors.length === 0) {
    return (
      <section className="contributors-section">
        <h2>Contributors</h2>
        <div className="contributors-empty">
          <p>No contributors yet.</p>
        </div>
      </section>
    );
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <section className="contributors-section">
      <h2>Contributors</h2>
      <div className="contributors-list">
        {contributors.map((contributor) => (
          <div key={contributor.address} className="contributor-card">
            <div className="contributor-info">
              <span className="contributor-address">
                {formatAddress(contributor.address)}
              </span>
            </div>
            <div className="contributor-count">
              {contributor.count} {contributor.count === 1 ? 'word' : 'words'}
            </div>
          </div>
        ))}
      </div>
      <p className="contributors-meta">
        {contributors.length} {contributors.length === 1 ? 'contributor' : 'contributors'}
      </p>
    </section>
  );
}
