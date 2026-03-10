/**
 * Search API Functions
 * Stateless one-shot search endpoint
 */

import { api } from './client';

export interface SearchRequest {
  query: string;
  chatHistory?: Array<{ role: string; content: string }>;
}

export interface SearchResponse {
  query: string;
  resolvedQuery: string;
  needsClarification: boolean;
  content?: string;
  status?: 'completed' | 'in_progress';
  statusExplanation?: string;
  images?: string[];
  reason?: string;
  questions?: string[];
}

export async function search(data: SearchRequest): Promise<SearchResponse> {
  return api.post<SearchResponse>('/search', data);
}
