
import type { StoryEntry } from '../types';

/**
 * Convert a timestamp (seconds since epoch) to a UTC calendar day string (YYYY-MM-DD)
 */
function timestampToUTCDay(timestamp: number): string {
  const date = new Date(timestamp * 1000); // Convert to milliseconds
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate the current daily streak for a user
 * 
 * Streak is defined as: number of consecutive UTC days (up to the last day they were active)
 * A day counts as active if the user added at least 1 word in any category that UTC day.
 * 
 * @param entries - All story entries
 * @param userAddress - The principal/address of the user
 * @returns The current streak in days (0 if no activity or no consecutive days)
 */
export function calculateStreak(entries: StoryEntry[], userAddress: string | null): number {
  if (!userAddress || !entries || entries.length === 0) {
    return 0;
  }

  // Filter to only entries from this user
  const userEntries = entries.filter((entry) => entry.sender === userAddress);

  if (userEntries.length === 0) {
    return 0;
  }

  // Convert timestamps to UTC calendar days and deduplicate
  const activeDays = new Set<string>();
  for (const entry of userEntries) {
    const dayKey = timestampToUTCDay(entry.timestamp);
    activeDays.add(dayKey);
  }

  // Convert to sorted array (most recent first)
  const sortedDays = Array.from(activeDays)
    .map((dayStr) => {
      // Parse back to Date for sorting
      const [year, month, day] = dayStr.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, day));
    })
    .sort((a, b) => b.getTime() - a.getTime()); // Descending (newest first)

  if (sortedDays.length === 0) {
    return 0;
  }

  // Calculate consecutive days starting from the most recent active day
  // We count backwards day-by-day until we hit a gap
  let streak = 0;
  const mostRecentDay = sortedDays[0];
  let currentDay = new Date(mostRecentDay);

  // Convert active days back to strings for easy lookup
  const activeDayStrings = new Set(activeDays);

  // Count consecutive days backwards from the most recent active day
  while (true) {
    const dayStr = timestampToUTCDay(Math.floor(currentDay.getTime() / 1000));
    
    if (activeDayStrings.has(dayStr)) {
      streak++;
      // Move back one day
      currentDay.setUTCDate(currentDay.getUTCDate() - 1);
    } else {
      // Gap found, streak is broken
      break;
    }
  }

  return streak;
}

