import apiClient from './apiClient';

export interface Insight {
  id: string;
  type: string;
  message: string;
  habitId: string | null;
  value: number;
  priority: number;
}

export interface InsightsResponse {
  type: string;
  aiInsight: string | null;
  fallbackInsights: { id: string; type: string; message: string }[];
  generatedAt: string;
  dataPoints: number;
  habitsAnalyzed: number;
  fromCache: boolean;
  message?: string;
}

export async function getInsights(forceRefresh = false): Promise<InsightsResponse> {
  const { data } = await apiClient.get('/insights', {
    params: forceRefresh ? { force: 'true' } : undefined,
  });
  return data;
}

/* Design Choices Summary
  Choice / Tool                 | Reason / Benefit                                                        | Source / Notes
  ------------------------------|-------------------------------------------------------------------------|-----------------------------------------
  apiClient (Axios instance)    | Centralized API client with baseURL, headers, and JWT interceptor       | Reuse from apiClient.ts
  Insight interface             | TypeScript type safety for individual insight objects                   | Ensures consistent handling in components
  InsightsResponse interface    | Encapsulates full API response: AI insight, fallback insights, metadata | Avoids ad-hoc object handling in UI
  getInsights()                 | Encapsulates GET /insights endpoint, returns typed InsightsResponse     | Components don’t handle HTTP logic
  fromCache field               | Indicates if response was served from cache                             | Useful for caching logic in UI
  Optional message field        | Provides error/info messages from API                                   | Makes error handling consistent
  Promise-based async/await     | Handles async API calls cleanly; allows try/catch in consuming code     | Standard JS async pattern
  Return consistent data object | Components can directly consume data without transformation             | Simplifies UI logic
*/
