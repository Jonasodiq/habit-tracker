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

export async function getInsights(): Promise<InsightsResponse> {
  const { data } = await apiClient.get('/insights');
  return data;
}