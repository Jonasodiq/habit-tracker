import apiClient from './apiClient';

export interface HabitStat {
  habitId: string;
  name: string;
  icon: string;
  color: string;
  frequency: string;
  streak: number;
  completions30d: number;
  completionRate: number;
}

export interface Statistics {
  summary: {
    totalHabits: number;
    totalCompletions: number;
    completedToday: number;
    bestStreak: number;
    avgCompletionRate: number;
    periodDays: number;
  };
  habits: HabitStat[];
}

export async function getStatistics(): Promise<Statistics> {
  const { data } = await apiClient.get('/statistics');
  return data;
}