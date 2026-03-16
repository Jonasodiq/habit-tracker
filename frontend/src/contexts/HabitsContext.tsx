import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getHabits, Habit } from '@/src/services/habitService';
import { getCompletions, Completion } from '@/src/services/completionService';

interface HabitsContextType {
  habits:         Habit[];
  completions:    Completion[];
  loading:        boolean;
  refreshing:     boolean;
  lastFetched:    number | null;
  loadAll:        () => Promise<void>;
  refresh:        () => Promise<void>;
  setHabits:      (habits: Habit[]) => void;
  setCompletions: (completions: Completion[]) => void;
}

const HabitsContext = createContext<HabitsContextType>({
  habits:         [],
  completions:    [],
  loading:        false,
  refreshing:     false,
  lastFetched:    null,
  loadAll:        async () => {},
  refresh:        async () => {},
  setHabits:      () => {},
  setCompletions: () => {},
});

const CACHE_TTL_MS = 30 * 1000; // 30 sekunder

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits]           = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading]         = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const loadAll = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && lastFetched && now - lastFetched < CACHE_TTL_MS) return;

    try {
      // Kolla om användaren är inloggad
      const token = await AsyncStorage.getItem('@auth:idToken');
      if (!token) return;

      setLoading(true);
      const [habitsData, completionsData] = await Promise.all([
        getHabits(),
        getCompletions(),
      ]);
      setHabits(habitsData);
      setCompletions(completionsData);
      setLastFetched(Date.now());
    } catch (err: any) {
        // Ignorera 401 — användaren är inte inloggad ännu
        if (err?.response?.status !== 401) {
            console.error('HabitsContext loadAll error:', err);
        }
    } finally {
        setLoading(false);
    }
  }, [lastFetched]);

  const refresh = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('@auth:idToken');
      if (!token) return;

      setRefreshing(true);
      const [habitsData, completionsData] = await Promise.all([
        getHabits(),
        getCompletions(),
      ]);
      setHabits(habitsData);
      setCompletions(completionsData);
      setLastFetched(Date.now());
    } catch (err: any) {
        if (err?.response?.status !== 401) {
            console.error('HabitsContext refresh error:', err);
        }
    } finally {
        setRefreshing(false);
    }
  }, []);

  return (
    <HabitsContext.Provider value={{
      habits,
      completions,
      loading,
      refreshing,
      lastFetched,
      loadAll:        () => loadAll(false),
      refresh,
      setHabits,
      setCompletions,
    }}>
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabits() {
  return useContext(HabitsContext);
}