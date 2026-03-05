import apiClient from './apiClient';

export interface Completion {
  completionId: string;
  userId: string;
  habitId: string;
  completedDate: string;
  createdAt: string;
}

export async function getCompletions(): Promise<Completion[]> {
  const { data } = await apiClient.get('/completions');
  return data.completions;
}

export async function completeHabit(habitId: string): Promise<Completion> {
  const { data } = await apiClient.post('/completions', { habitId });
  return data.completion;
}

export async function deleteCompletion(completionId: string): Promise<void> {
  await apiClient.delete(`/completions/${completionId}`);
}
