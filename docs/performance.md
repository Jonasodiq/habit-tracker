# Performance Optimization — Habit Tracker

## Implemented Optimizations

### 1. Global State with HabitsContext

* Habits and completions are shared globally using React Context
* 30-second cache to avoid unnecessary API calls during tab navigation
* `loadAll()` skips fetching if data is fresh (< 30 seconds)
* `refresh()` forces a new fetch (e.g. pull-to-refresh)

### 2. Parallel API Calls with Promise.all

* All API requests are executed in parallel instead of sequentially
* Example: habits and completions are fetched simultaneously

### 3. useFocusEffect + useCallback

* Data is loaded only when the screen gains focus
* `useCallback` prevents unnecessary re-renders

### 4. Animated Progress Bar

* Uses `react-native-progress` for smooth animations
* Native driver for improved performance

### 5. Bundle Size Optimization

* No unnecessary libraries included
* Tree-shaking enabled via Expo bundler
