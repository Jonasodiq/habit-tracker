# Performance-optimering

## Implementerade optimeringar

### 1. Global State med HabitsContext
- Habits och completions delas globalt via React Context
- 30 sekunders cache — inga onödiga API-anrop vid flikbyte
- `loadAll()` hoppar över fetch om data är färsk (< 30 sek)
- `refresh()` tvingar ny fetch vid pull-to-refresh

### 2. Promise.all för parallella API-anrop
- Alla API-anrop körs parallellt istället för sekventiellt
- Exempel: habits + completions hämtas samtidigt

### 3. useFocusEffect + useCallback
- Data laddas bara när skärmen får fokus
- useCallback förhindrar onödiga re-renders

### 4. Animerad Progress Bar
- react-native-progress för smooth animationer
- Native driver för bättre prestanda

### 5. Bundle size
- Inga onödiga bibliotek
- Tree-shaking via expo bundler