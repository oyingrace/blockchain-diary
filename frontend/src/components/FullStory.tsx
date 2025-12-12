import type { StoryEntry } from '../types';

interface FullStoryProps {
  story: StoryEntry[];
  isLoading?: boolean;
}

export function FullStory({ story, isLoading }: FullStoryProps) {
  if (isLoading) {
    return (
      <section style={{ marginBottom: '2rem' }}>
        <h2>Full Story</h2>
        <p>Loading story...</p>
      </section>
    );
  }

  if (!story || story.length === 0) {
    return (
      <section style={{ marginBottom: '2rem' }}>
        <h2>Full Story</h2>
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          The story is empty. Be the first to add a word!
        </p>
      </section>
    );
  }

  const storyText = story.map((entry) => entry.word).join(' ');

  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2>Full Story</h2>
      <div
        style={{
          padding: '1.5rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          minHeight: '100px',
          lineHeight: '1.6',
          fontSize: '1.1rem',
        }}
      >
        {storyText}
      </div>
      <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
        {story.length} {story.length === 1 ? 'word' : 'words'}
      </p>
    </section>
  );
}

