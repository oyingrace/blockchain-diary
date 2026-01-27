
import type { StoryEntry } from '../types';
import './StatisticsDashboard.css';

interface StatisticsDashboardProps {
  story: StoryEntry[];
  isLoading?: boolean;
}

interface Statistics {
  totalWords: number;
  totalContributors: number;
  averageWordsPerContributor: number;
  wordsToday: number;
  wordsThisWeek: number;
  categoryDistribution: Record<string, number>;
