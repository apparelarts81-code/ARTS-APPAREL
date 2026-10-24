import { errorResponse } from './response';

const MAX_PAYLOAD_BYTES = 100 * 1024; // 100 KB limit to prevent payload abuse

export interface ParseJsonResult<T = any> {
  data?: T;
  errorResponse?: Response;
}

/**
 * Safely parses and validates JSON request body with size limits and Content-Type enforcement.
 */
export async function parseJsonBody<T = any>(
  request: Request,
  corsHeaders: Record<string, string> = {}
): Promise<ParseJsonResult<T>> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return {
      errorResponse: errorResponse(
        'Invalid Content-Type. Expected application/json.',
        415,
        {},
        corsHeaders
      ),
    };
  }

  // Check Content-Length header if present
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return {
      errorResponse: errorResponse(
        `Payload exceeds maximum allowed size of ${MAX_PAYLOAD_BYTES / 1024} KB.`,
        413,
        {},
        corsHeaders
      ),
    };
  }

  try {
    const rawText = await request.text();
    if (rawText.length > MAX_PAYLOAD_BYTES) {
      return {
        errorResponse: errorResponse(
          `Payload exceeds maximum allowed size of ${MAX_PAYLOAD_BYTES / 1024} KB.`,
          413,
          {},
          corsHeaders
        ),
      };
    }

    if (!rawText || rawText.trim().length === 0) {
      return {
        errorResponse: errorResponse(
          'Request body cannot be empty.',
          400,
          {},
          corsHeaders
        ),
      };
    }

    const parsed = JSON.parse(rawText) as T;
    return { data: parsed };
  } catch {
    return {
      errorResponse: errorResponse(
        'Malformed JSON syntax in request body.',
        400,
        {},
        corsHeaders
      ),
    };
  }
}
