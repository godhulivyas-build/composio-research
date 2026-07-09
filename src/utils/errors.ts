/**
 * Custom error types for the pipeline.
 */

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ResearchError extends Error {
  constructor(
    message: string,
    public appName: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ResearchError';
  }
}

export class VerificationError extends Error {
  constructor(
    message: string,
    public appName: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'VerificationError';
  }
}

export class ExternalServiceError extends Error {
  constructor(
    message: string,
    public service: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ExternalServiceError';
  }
}

/**
 * Extract error message safely.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Check if error is a retriable error.
 */
export function isRetriableError(error: unknown): boolean {
  if (error instanceof ExternalServiceError) {
    const code = error.statusCode;
    return code ? code >= 500 || code === 429 : true;
  }
  return false;
}
