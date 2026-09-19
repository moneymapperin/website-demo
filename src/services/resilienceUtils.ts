/**
 * Principal Engineer's Resilience Toolkit
 * Port of reference/moneymapper_app/lib/services/resilience_utils.dart
 */

export class ApiException extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiException.prototype);
  }

  override toString(): string {
    return this.message;
  }
}

export interface RetryOptions<T> {
  task: () => Promise<T>;
  context: string;
  maxAttempts?: number;
  initialDelayMs?: number;
}

export class ResilienceUtils {
  /**
   * Executes a task with exponential backoff retries.
   * Standard: 3 attempts with 2s, 4s delays.
   * Deterministic errors (ApiException with 401, 403, 404) are NOT retried and rethrow immediately.
   */
  static async retry<T>({
    task,
    context,
    maxAttempts = 3,
    initialDelayMs = 2000,
  }: RetryOptions<T>): Promise<T> {
    let attempts = 0;

    while (true) {
      attempts++;
      try {
        return await task();
      } catch (e: any) {
        // Deterministic errors: immediate rethrow with zero delay
        if (
          e instanceof ApiException &&
          (e.statusCode === 401 || e.statusCode === 403 || e.statusCode === 404)
        ) {
          throw e;
        }

        if (attempts >= maxAttempts) {
          if (process.env.NODE_ENV !== 'test') {
            console.error(`[CRITICAL FAILURE] ${context} after ${attempts} attempts:`, e);
          }
          throw e;
        }

        const delayMs = initialDelayMs * attempts;
        if (process.env.NODE_ENV !== 'test') {
          console.warn(
            `[RETRY] ${context}: Attempt ${attempts} failed. Retrying in ${delayMs / 1000}s...`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  /**
   * Sanitizes technical error messages for end-users.
   * Rule: No raw IDs, 500s, or stack traces.
   */
  static sanitizeErrorMessage(error: unknown): string {
    let rawMsg = '';
    if (error instanceof Error) {
      rawMsg = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      rawMsg = String((error as any).message);
    } else {
      rawMsg = String(error);
    }
    const msg = rawMsg.toLowerCase();

    if (
      msg.includes('network') ||
      msg.includes('socket') ||
      msg.includes('failed host') ||
      msg.includes('fetch')
    ) {
      return 'Connection issue detected. Please check your internet and try again.';
    }
    if (msg.includes('429') || msg.includes('rate limit')) {
      return "Servers are busy right now. We'll refresh your data in a moment.";
    }
    if (msg.includes('timeout')) {
      return 'The request took too long. Please try refreshing again.';
    }
    if (msg.includes('auth') || msg.includes('401') || msg.includes('403')) {
      return 'Session expired or unauthorized. Please log in again.';
    }

    return "Something went wrong on our end. We've logged this and are looking into it.";
  }

  /**
   * Safely extracts numeric data with validation to prevent runtime crashes.
   */
  static safeDouble(value: unknown, fallback = 0.0): number {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'number') return isNaN(value) ? fallback : value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  }
}
