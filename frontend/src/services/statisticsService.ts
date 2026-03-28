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

/*    Design Choices Summary
  Choice / Tool                   | Reason / Benefit                                                  | Notes / Source
  --------------------------------|-------------------------------------------------------------------|-------------------------------------------
  apiClient (Axios instance)      | Centralized HTTP client with JWT automatically added              | Consistent with other services
  HabitStat interface             | TypeScript typing for per-habit statistics                        | Ensures consistent property access in components
  Statistics interface            | Encapsulates summary + detailed habit stats                       | Avoids ad-hoc object handling
  getStatistics()                 | Async function to fetch statistics from /statistics endpoint      | Components consume typed data directly
  completionRate & completions30d | Precomputed metrics for quick UI rendering                        | Avoids client-side calculation
  summary object                  | Aggregated metrics like totalHabits, bestStreak, avgCompletionRate| Enables dashboards and progress views
  Promise-based async/await       | Standard JS async pattern                                         | Easy try/catch error handling in components
  Consistent return object        | Components can render summary + habit stats without transformation| Simplifies UI code and improves maintainability
*/