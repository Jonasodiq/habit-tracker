import apiClient from './apiClient';

export interface Habit {
  habitId: string;
  userId: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  streak: number;
  createdAt: string;
}

export interface CreateHabitInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
}

export interface UpdateHabitInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
}

export async function getHabits(): Promise<Habit[]> {
  const { data } = await apiClient.get('/habits');
  return data.habits;
}

export async function createHabit(input: CreateHabitInput): Promise<Habit> {
  const { data } = await apiClient.post('/habits', input);
  return data.habit;
}

export async function updateHabit(habitId: string, input: UpdateHabitInput): Promise<Habit> {
  const { data } = await apiClient.patch(`/habits/${habitId}`, input);
  return data.habit;
}

export async function deleteHabit(habitId: string): Promise<void> {
  await apiClient.delete(`/habits/${habitId}`);
}

/*      Design Choices Summary
  Choice / Tool                       | Reason / Benefit                                                          | Source / Notes
  ------------------------------------|---------------------------------------------------------------------------|------------------------------------------------------------
  apiClient (Axios instance)          | Centralized API client with baseURL, headers, and JWT interceptor         | See apiClient.ts summary
  Typed Habit interface               | TypeScript type safety – all components know exactly the fields of a Habit| TypeScript best practice
  CreateHabitInput / UpdateHabitInput | Ensures only required fields are sent to API, optional fields are flexible| Clean API contract, prevents overposting
  getHabits()                         | Encapsulates GET /habits endpoint – components don’t handle HTTP logic    | Separation of concerns
  createHabit(input)                  | Encapsulates POST /habits – returns new Habit object                      | Simplifies optimistic UI and state updates
  updateHabit(habitId, input)         | Encapsulates PATCH /habits/:id – returns updated Habit object             | Single function for updates, consistent return type
  deleteHabit(habitId)                | Encapsulates DELETE /habits/:id – components don’t manage API details     | Clean, centralized API abstraction
  Promise-based async/await           | Handles async API calls cleanly; allows try/catch in consuming code       | Standard JS async pattern
  Return consistent data objects      | API returns `{ data.habit }` and `{ data.habits }`                        | Reduces client-side transformation and simplifies state management
*/