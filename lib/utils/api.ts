/**
 * API client for Threadweaver backend.
 * Handles communication with FastAPI server.
 */

import type {
  GenerateDecisionRequest,
  GenerateDecisionResponse,
  ApplyDecisionRequest,
  ApplyDecisionResponse,
  SimulateAutopilotRequest,
  SimulateAutopilotResponse,
  GenerateCustomCardsRequest,
  GenerateCustomCardsResponse,
} from '../types';

// API base URL (can be configured via environment variable)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/** Human-readable error when the backend is not reachable */
function connectionError(url: string, cause: unknown): Error {
  const message =
    cause instanceof TypeError && cause.message === 'Failed to fetch'
      ? `Cannot reach the API at ${url}. Make sure the backend is running (e.g. in a terminal: cd api && python -m uvicorn main:app --reload --port 8003).`
      : cause instanceof Error
        ? cause.message
        : 'Unknown API error occurred';
  return new Error(message);
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle different error formats
      let errorMessage = `API error: ${response.status} ${response.statusText}`;

      if (errorData.detail) {
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          // Pydantic validation errors
          errorMessage = errorData.detail
            .map((err: { loc?: string[]; msg?: string }) => `${err.loc?.join('.') || 'field'}: ${err.msg}`)
            .join(', ');
        } else {
          errorMessage = JSON.stringify(errorData.detail);
        }
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('API error:')) {
      throw error;
    }
    throw connectionError(url, error);
  }
}

/**
 * Generate next decision card based on current state
 */
export async function generateDecision(
  request: GenerateDecisionRequest
): Promise<GenerateDecisionResponse> {
  return apiFetch<GenerateDecisionResponse>('/api/generate-decision', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Apply a chosen decision option to current metrics
 */
export async function applyDecision(
  request: ApplyDecisionRequest
): Promise<ApplyDecisionResponse> {
  return apiFetch<ApplyDecisionResponse>('/api/apply-decision', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Run full autopilot simulation
 */
export async function simulateAutopilot(
  request: SimulateAutopilotRequest
): Promise<SimulateAutopilotResponse> {
  return apiFetch<SimulateAutopilotResponse>('/api/simulate-autopilot', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Check API health status
 */
export async function checkHealth(): Promise<{
  status: string;
  version: string;
  cardsLoaded: number;
}> {
  return apiFetch('/health', { method: 'GET' });
}

/**
 * Generate custom decision cards based on company profile using AI
 */
export async function generateCustomCards(
  request: GenerateCustomCardsRequest
): Promise<GenerateCustomCardsResponse> {
  return apiFetch<GenerateCustomCardsResponse>('/api/generate-custom-cards', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Error types for better error handling
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}
