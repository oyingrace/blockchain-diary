
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
      averageWordsPerContributor: 0,
      wordsToday: 0,
      wordsThisWeek: 0,
      categoryDistribution: {},
      mostActiveCategory: '',
    };
  }

  const totalWords = story.length;
  
  // Calculate unique contributors
  const contributorsSet = new Set(story.map(entry => entry.sender));
  const totalContributors = contributorsSet.size;
  const averageWordsPerContributor = totalContributors > 0 
    ? Number((totalWords / totalContributors).toFixed(2))
    : 0;

  // Calculate words added today and this week
  // Note: Contract currently returns u0 for timestamps, so these may be 0
  const now = Date.now();
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const wordsToday = story.filter(entry => {
    if (entry.timestamp === 0) return false; // Skip invalid timestamps
    return entry.timestamp * 1000 >= todayStart; // Convert to milliseconds
  }).length;

  const wordsThisWeek = story.filter(entry => {
    if (entry.timestamp === 0) return false;
    return entry.timestamp * 1000 >= weekAgo;
  }).length;

