import apiClient from './apiClient';

export interface Habit {
   habitId: string;
  userId: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
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
