import { useState } from 'react';
import './App.css';
import { WalletConnection } from './components/WalletConnection';
import { AddWord } from './components/AddWord';
import { FullStory } from './components/FullStory';
import { Contributors } from './components/Contributors';
import type { StoryEntry } from './types';

function App() {
  const [story, setStory] = useState<StoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Blockchain Diary</h1>
        <WalletConnection />
      </header>

      <main>
        <AddWord />
        <FullStory story={story} isLoading={isLoading} />
        <Contributors story={story} isLoading={isLoading} />
      </main>
    </div>
  );
}

export default App;
