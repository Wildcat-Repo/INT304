import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import '@testing-library/jest-dom';

// A fake API that stands in for the Express server: global.fetch is replaced by a
// function that keeps employees in memory and answers like server/src/employees.js.
function mockApi(initialEmployees = []) {
  const employees = [...initialEmployees];
  let nextId = 1;
  const respond = (status, body) => Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body)
  });

  global.fetch = jest.fn((url, options = {}) => {
    if (url === '/api/employees' && options.method === 'POST') {
      const data = JSON.parse(options.body);
      if (!data.name || !data.name.trim()) {
        return respond(400, { errors: ['name is required'] });
      }
      const saved = { ...data, employee_id: `uuid-${nextId++}` };
      employees.push(saved);
      return respond(201, saved);
    }
    if (url === '/api/employees') {
      return respond(200, [...employees]);
    }
    return respond(404, { error: 'Not found' });
  });
  return employees;
}

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, '', '/');
});

afterEach(() => {
  delete global.fetch;
});

function typeName(name) {
  userEvent.clear(screen.getByLabelText(/name/i));
  userEvent.type(screen.getByLabelText(/name/i), name);
}

function submit() {
  userEvent.click(screen.getByRole('button', { name: /submit/i }));
}

test('renders the employee form', async () => {
  mockApi();
  render(<App />);
  expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();

  // Let the initial employee load finish so its state update happens inside the test
  userEvent.click(screen.getByRole('link', { name: /employee list/i }));
  expect(await screen.findByText(/no employees added yet/i)).toBeInTheDocument();
});

test('loads employees from the API and shows them in the list', async () => {
  mockApi([{ employee_id: 'uuid-a', name: 'Jane Doe' }]);
  render(<App />);

  userEvent.click(screen.getByRole('link', { name: /employee list/i }));

  expect(await screen.findByRole('link', { name: 'Jane Doe' })).toHaveAttribute('href', '/employees/uuid-a');
  expect(global.fetch.mock.calls[0][0]).toBe('/api/employees');
});

test('submitting posts the employee to the API and adds it to the list', async () => {
  const saved = mockApi();
  render(<App />);

  typeName('Jane Doe');
  submit();

  await waitFor(() => expect(saved).toHaveLength(1));
  const [, options] = global.fetch.mock.calls.find(([, o]) => o && o.method === 'POST');
  expect(JSON.parse(options.body)).toEqual({ name: 'Jane Doe', email: '', title: '', department: '' });

  userEvent.click(screen.getByRole('link', { name: /employee list/i }));
  expect(await screen.findByRole('link', { name: 'Jane Doe' })).toBeInTheDocument();
});

test('the form clears after a successful save', async () => {
  mockApi();
  render(<App />);

  typeName('Jane Doe');
  submit();

  await waitFor(() => expect(screen.getByLabelText(/name/i)).toHaveValue(''));
});

test('shows API validation errors and keeps the input when saving fails', async () => {
  const saved = mockApi();
  render(<App />);

  typeName('   ');
  submit();

  expect(await screen.findByRole('alert')).toHaveTextContent('name is required');
  expect(saved).toHaveLength(0);
  expect(screen.getByLabelText(/name/i)).toHaveValue('   ');
});

test('shows an error when the API cannot be reached', async () => {
  global.fetch = jest.fn(() => Promise.reject(new TypeError('Failed to fetch')));
  render(<App />);

  userEvent.click(screen.getByRole('link', { name: /employee list/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach the server/i);
});

test('clicking an employee link opens the populated employee form', async () => {
  mockApi([{
    employee_id: 'uuid-a',
    name: 'Jane Doe',
    email: 'jane@example.com',
    title: 'Engineer',
    department: 'IT'
  }]);
  render(<App />);

  userEvent.click(screen.getByRole('link', { name: /employee list/i }));
  userEvent.click(await screen.findByRole('link', { name: 'Jane Doe' }));

  expect(screen.getByLabelText(/name/i)).toHaveValue('Jane Doe');
  expect(screen.getByLabelText(/email/i)).toHaveValue('jane@example.com');
  expect(screen.getByLabelText(/title/i)).toHaveValue('Engineer');
  expect(screen.getByLabelText(/department/i)).toHaveValue('IT');
});

test('an unknown employee URL shows "Employee not found"', async () => {
  mockApi([{ employee_id: 'uuid-a', name: 'Jane Doe' }]);
  window.history.pushState({}, '', '/employees/does-not-exist');
  render(<App />);

  expect(await screen.findByText(/employee not found/i)).toBeInTheDocument();
  expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
});

test('editing an employee in the details view does not change the new-employee draft', async () => {
  mockApi([{ employee_id: 'uuid-a', name: 'Jane Doe', email: 'jane@example.com' }]);
  render(<App />);

  userEvent.click(screen.getByRole('link', { name: /employee list/i }));
  userEvent.click(await screen.findByRole('link', { name: 'Jane Doe' }));
  userEvent.type(screen.getByLabelText(/title/i), 'Manager');

  expect(localStorage.getItem('current_employee')).toBeNull();

  userEvent.click(screen.getByRole('link', { name: /^form$/i }));
  expect(screen.getByLabelText(/name/i)).toHaveValue('');
  expect(screen.getByLabelText(/email/i)).toHaveValue('');
  expect(screen.getByLabelText(/title/i)).toHaveValue('');
});
