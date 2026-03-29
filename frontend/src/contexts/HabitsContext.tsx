import { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react'; // Källa React Context: https://react.dev/reference/react/createContext
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

const CACHE_TTL_MS = 30 * 1000; // 30 sek

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits]           = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading]         = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const lastFetchedRef                = useRef<number | null>(null);

  const loadAll = useCallback(async () => { // Källa: https://react.dev/reference/react/useCallback
    const now = Date.now();
    const cachedAt = lastFetchedRef.current;
    if (cachedAt && now - cachedAt < CACHE_TTL_MS) return;

    try {
      // Check if the user is logged in
      const token = await AsyncStorage.getItem('@auth:idToken');
      if (!token) return;

      setLoading(true);
      const [habitsData, completionsData] = await Promise.all([
        getHabits(),
        getCompletions(),
      ]);
      setHabits(habitsData);
      setCompletions(completionsData);
      const fetchedAt = Date.now();
      lastFetchedRef.current = fetchedAt;
      setLastFetched(fetchedAt);
    } catch (err: any) {
        // Ignore 401 — user is not logged in yet
        if (err?.response?.status !== 401) {
            console.error('HabitsContext loadAll error:', err);
        }
    } finally {
        setLoading(false);
    }
  }, []);

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
      const fetchedAt = Date.now();
      lastFetchedRef.current = fetchedAt;
      setLastFetched(fetchedAt);
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
      loadAll,
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

/*    Design Choices Summary
  Choice / Tool                       | Reason / Benefit                                                                 | Source
  ------------------------------------|----------------------------------------------------------------------------------|------------------------------------------------------------
  React Context (instead of Redux)    | Simpler for MVP – Context is sufficient for this app size                        | React Docs: https://react.dev/reference/react/createContext
  30s client-side cache               | Prevents unnecessary API calls when navigating between tabs                      | UX best practice
  Promise.all() for parallel fetching | Halves load time compared to sequential API calls                                | MDN Promise.all: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
  Separate loading / refreshing states| Better UX – distinct indicators for initial load vs pull-to-refresh              | React UX pattern
  401 filtering in catch              | Eliminates expected error logs during app startup                                | Defensive programming
  useRef + stable useCallback         | Avoids stale closures while keeping the 30s cache accurate across tab navigation | React Docs: https://react.dev/reference/react/useRef
  Optimistic UI (local state updates) | Immediate UI feedback while API is pending – improves perceived responsiveness   | UX best practice
  Token check before API call         | Avoids making unauthorized API calls that return 401                             | Security best practice
  Custom hook (useHabits)             | Components use useHabits() instead of useContext(HabitsContext) – more expressive| React Custom Hooks: https://react.dev/learn/reusing-logic-with-custom-hooks
*/
