import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import '@testing-library/jest-dom';

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
