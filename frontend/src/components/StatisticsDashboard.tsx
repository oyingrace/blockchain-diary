
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
  mostActiveCategory: string;
}

function calculateStatistics(story: StoryEntry[]): Statistics {
  if (!story || story.length === 0) {
    return {
      totalWords: 0,
      totalContributors: 0,
