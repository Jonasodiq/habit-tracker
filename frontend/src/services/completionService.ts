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

/*    Design Choices Summary
  Choice / Tool                 | Reason / Benefit                                                                | Source / Notes
  ------------------------------|---------------------------------------------------------------------------------|------------------------------------------------------------
  apiClient (Axios instance)    | Centralized API client with baseURL, headers, and JWT interceptor               | See apiClient.ts summary
  Typed Completion interface    | Ensures TypeScript type safety – components know exactly what data to expect    | TypeScript best practice
  getCompletions()              | Encapsulates API call – components don’t handle endpoints                       | Separation of concerns
  completeHabit(habitId)        | Single function to mark habit as completed – returns updated Completion object  | Simplifies optimistic UI updates
  deleteCompletion(completionId)| Single function to remove completion – components don’t manage API logic        | Clean code principle
  Promise-based async/await     | Handles asynchronous API calls cleanly with try/catch in consuming code         | Standard JS async pattern
  Return data objects           | API returns data in consistent format (`data.completions`, `data.completion`)   | Reduces client-side transformation
*/
