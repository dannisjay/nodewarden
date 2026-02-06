// JSON response helper
export function jsonResponse(data: any, status: number = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(),
      ...headers,
    },
  });
}

// Error response helper
export function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse(
    {
      error: message,
      error_description: message,
      ErrorModel: {
        Message: message,
        Object: 'error',
      },
    },
    status
  );
}

// Identity endpoint error response (for /identity/connect/token)
export function identityErrorResponse(message: string, error: string = 'invalid_grant', status: number = 400): Response {
  return jsonResponse(
    {
      error: error,
      error_description: message,
      ErrorModel: {
        Message: message,
        Object: 'error',
      },
    },
    status
  );
}

// CORS headers
export function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Device-Type, Bitwarden-Client-Name, Bitwarden-Client-Version',
    'Access-Control-Max-Age': '86400',
  };
}

// Handle CORS preflight
export function handleCors(): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

// HTML response helper
export function htmlResponse(html: string, status: number = 200): Response {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...getCorsHeaders(),
    },
  });
}
