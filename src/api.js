// Calls to the Express API in server/. In development, the "proxy" setting in
// package.json forwards /api requests from the React dev server to http://localhost:5001.

// Error with the list of messages returned by the API (for example, validation errors)
export class ApiError extends Error {
  constructor(messages, status) {
    super(messages.join(', '));
    this.messages = messages;
    this.status = status;
  }
}

async function request(path, options) {
  let response;
  try {
    response = await fetch(path, options);
  } catch (error) {
    throw new ApiError(['Could not reach the server. Is the API running?'], 0);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const messages = body?.errors || (body?.error ? [body.error] : [`Request failed (${response.status})`]);
    throw new ApiError(messages, response.status);
  }
  return body;
}

// Get all employees
export function fetchEmployees() {
  return request('/api/employees');
}

// Save a new employee. The API generates employee_id and returns the saved record.
export function createEmployee({ name, email, title, department }) {
  return request('/api/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, title, department })
  });
}
