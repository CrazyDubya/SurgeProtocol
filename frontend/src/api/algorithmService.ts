/**
 * Algorithm Service
 *
 * API service for Algorithm interactions - messages, responses, standing.
 */

import api from './client';

// =============================================================================
// TYPES
// =============================================================================

export type AlgorithmTone = 'neutral' | 'approving' | 'disappointed' | 'urgent' | 'cryptic' | 'threatening';
export type ResponseVariant = 'compliant' | 'questioning' | 'defiant' | 'silent';

export interface AlgorithmMessage {
  id: string;
  content: string;
  tone: AlgorithmTone;
  createdAt: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  responseVariant: ResponseVariant | null;
  responseText: string | null;
  source: string;
}

export interface AlgorithmStanding {
  algorithmRep: number;
  trustLevel: number;
  complianceRate: number;
  totalMessages: number;
  daysConnected: number;
  lastInteraction: string | null;
}

export interface AlgorithmRepChange {
  id: string;
  source: string;
  amount: number;
  timestamp: string;
}

export interface AlgorithmDirective {
  id: string;
  content: string;
  priority: number;
  createdAt: string;
  expiresAt: string | null;
}

// =============================================================================
// API RESPONSES
// =============================================================================

interface MessagesResponse {
  success: boolean;
  messages: AlgorithmMessage[];
}

interface HistoryResponse {
  success: boolean;
  messages: AlgorithmMessage[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

interface RespondResponse {
  success: boolean;
  repChange: number;
  followUp: AlgorithmMessage;
}

interface StandingResponse {
  success: boolean;
  standing: AlgorithmStanding;
  recentChanges: AlgorithmRepChange[];
}

interface DirectivesResponse {
  success: boolean;
  directives: AlgorithmDirective[];
}

// =============================================================================
// SERVICE
// =============================================================================

export const algorithmService = {
  /**
   * Get pending (unacknowledged) messages
   */
  async getMessages(): Promise<MessagesResponse> {
    return api.get<MessagesResponse>('/api/algorithm/messages');
  },

  /**
   * Get message history
   */
  async getHistory(options?: { limit?: number; offset?: number }): Promise<HistoryResponse> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());

    const query = params.toString();
    return api.get<HistoryResponse>(`/api/algorithm/history${query ? `?${query}` : ''}`);
  },

  /**
   * Respond to a message
   */
  async respond(messageId: string, variant: ResponseVariant, text?: string): Promise<RespondResponse> {
    return api.post<RespondResponse>(`/api/algorithm/messages/${messageId}/respond`, {
      variant,
      text,
    });
  },

  /**
   * Get current Algorithm standing
   */
  async getStanding(): Promise<StandingResponse> {
    return api.get<StandingResponse>('/api/algorithm/standing');
  },

  /**
   * Get active directives
   */
  async getDirectives(): Promise<DirectivesResponse> {
    return api.get<DirectivesResponse>('/api/algorithm/directives');
  },
};

export default algorithmService;
