import type { StoryEntry } from '../types';

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
      <section>
        <h2>Contributors</h2>
        <p>Loading contributors...</p>
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
      <section>
        <h2>Contributors</h2>
        <p style={{ color: '#666', fontStyle: 'italic' }}>No contributors yet.</p>
      </section>
    );
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <section>
      <h2>Contributors</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {contributors.map((contributor) => (
          <div
            key={contributor.address}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #e9ecef',
            }}
          >
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {formatAddress(contributor.address)}
              </div>
            </div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>
              {contributor.count} {contributor.count === 1 ? 'word' : 'words'}
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
        {contributors.length} {contributors.length === 1 ? 'contributor' : 'contributors'}
      </p>
    </section>
  );
}

