/**
 * JSON Response & Error Utilities for Worker endpoints
 */

export function jsonResponse(
  data: any,
  status: number = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}

export function errorResponse(
  message: string,
  status: number = 400,
  extra: Record<string, any> = {},
  extraHeaders: Record<string, string> = {}
): Response {
  return jsonResponse(
    {
      error: message,
      ...extra,
    },
    status,
    extraHeaders
  );
}
