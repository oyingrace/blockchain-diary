import './App.css';
import { WalletConnection } from './components/WalletConnection';
import { AddWord } from './components/AddWord';
import { FullStory } from './components/FullStory';
import { Contributors } from './components/Contributors';
import { useStory } from './hooks/useStory';

function App() {
  const { story, isLoading, error, refetch } = useStory();

  return (
    <div className="app">
      <div className="app-container">
        <header className="app-header">
          <h1>Blockchain Diary</h1>
          <WalletConnection />
        </header>

        {error && (
          <div className="error-banner">
            Error: {error}
          </div>
        )}

        <main className="main-content">
          <AddWord onWordAdded={refetch} />
          <FullStory story={story} isLoading={isLoading} />
          <Contributors story={story} isLoading={isLoading} />
        </main>
      </div>
    </div>
  );
}

export default App;
