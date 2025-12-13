import type { StoryEntry } from '../types';
import './FullStory.css';

interface FullStoryProps {
  story: StoryEntry[];
  isLoading?: boolean;
}

export function FullStory({ story, isLoading }: FullStoryProps) {
  if (isLoading) {
    return (
      <section className="story-section">
        <h2>Full Story</h2>
        <div className="story-container loading">
          <p>Loading story...</p>
        </div>
      </section>
    );
  }

  if (!story || story.length === 0) {
    return (
      <section className="story-section">
        <h2>Full Story</h2>
        <div className="story-container empty">
          <p>The story is empty. Be the first to add a word!</p>
        </div>
      </section>
    );
  }

  const storyText = story.map((entry) => entry.word).join(' ');

  return (
    <section className="story-section">
      <h2>Full Story</h2>
      <div className="story-container">
        {storyText}
      </div>
      <p className="story-meta">
        {story.length} {story.length === 1 ? 'word' : 'words'}
      </p>
    </section>
  );
}
