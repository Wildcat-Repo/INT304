import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

beforeEach(() => {
  localStorage.clear();
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  console.log.mockRestore();
});

function submitEmployee(name) {
  userEvent.clear(screen.getByLabelText(/name/i));
  userEvent.type(screen.getByLabelText(/name/i), name);
  userEvent.click(screen.getByRole('button', { name: /submit/i }));
}

function savedEmployees() {
  return JSON.parse(localStorage.getItem('employees'));
}

test('renders the employee form', () => {
  render(<App />);
  expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
});

test('submitting adds the employee to the employees array in localStorage', () => {
  render(<App />);

  submitEmployee('Jane Doe');
  submitEmployee('John Smith');

  expect(savedEmployees().map((e) => e.name)).toEqual(['Jane Doe', 'John Smith']);
});

test('new employees are added to the list already saved in localStorage', () => {
  localStorage.setItem('employees', JSON.stringify([{ name: 'Existing' }]));
  render(<App />);

  submitEmployee('Jane Doe');

  expect(savedEmployees().map((e) => e.name)).toEqual(['Existing', 'Jane Doe']);
});

test('starts with an empty list if the saved employees data is invalid', () => {
  localStorage.setItem('employees', 'not json');
  render(<App />);

  submitEmployee('Jane Doe');

  expect(savedEmployees().map((e) => e.name)).toEqual(['Jane Doe']);
});

test('clicking an employee link opens the populated employee form', () => {
  localStorage.setItem(
    'employees',
    JSON.stringify([{
      id: '1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      title: 'Engineer',
      department: 'IT'
    }])
  );

  render(<App />);
  userEvent.click(screen.getByRole('link', { name: /employee list/i }));
  userEvent.click(screen.getByRole('link', { name: 'Jane Doe' }));

  expect(screen.getByLabelText(/name/i)).toHaveValue('Jane Doe');
  expect(screen.getByLabelText(/email/i)).toHaveValue('jane@example.com');
  expect(screen.getByLabelText(/title/i)).toHaveValue('Engineer');
  expect(screen.getByLabelText(/department/i)).toHaveValue('IT');
});

test('editing an employee in the details view does not change the new-employee draft', () => {
  localStorage.setItem(
    'employees',
    JSON.stringify([{ id: '1', name: 'Jane Doe', email: 'jane@example.com' }])
  );

  render(<App />);
  userEvent.click(screen.getByRole('link', { name: /employee list/i }));
  userEvent.click(screen.getByRole('link', { name: 'Jane Doe' }));
  userEvent.type(screen.getByLabelText(/title/i), 'Manager');

  expect(localStorage.getItem('current_employee')).toBeNull();

  userEvent.click(screen.getByRole('link', { name: /^form$/i }));
  expect(screen.getByLabelText(/name/i)).toHaveValue('');
  expect(screen.getByLabelText(/email/i)).toHaveValue('');
  expect(screen.getByLabelText(/title/i)).toHaveValue('');
});

test('a submitted employee always gets a new id, even if the draft contains one', () => {
  localStorage.setItem('employees', JSON.stringify([{ id: '1', name: 'Jane Doe' }]));
  localStorage.setItem('current_employee', JSON.stringify({ id: '1', name: 'Jane Doe' }));
  render(<App />);

  userEvent.click(screen.getByRole('button', { name: /submit/i }));

  const ids = savedEmployees().map((e) => e.id);
  expect(ids).toHaveLength(2);
  expect(new Set(ids).size).toBe(2);
});
