// Address of the NestJS backend, set in client/.env as VITE_API_URL.
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

// An error that remembers the HTTP status, so a page can tell "not found" from "server down".
export class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

// Reads the message from a failed Nest response, e.g. { statusCode: 404, message: "Book 9 not found" }.
export async function readError(res) {
  try {
    const body = await res.json();
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    if (message) return message;
  } catch {
    // the body was not JSON, fall through
  }
  return `The server answered with status ${res.status}.`;
}

// Turns any error into a sentence a visitor can understand.
export function friendlyMessage(error) {
  if (error instanceof HttpError) return error.message;
  return `Could not reach the library server at ${API_URL}. Check that the API is running.`;
}
