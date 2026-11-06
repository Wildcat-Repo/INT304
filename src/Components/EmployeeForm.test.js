import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EmployeeForm from './EmployeeForm';

const fields = [
  { id: 'employee-name', label: /name/i, type: 'text', value: 'Jane Doe' },
  { id: 'employee-email', label: /email/i, type: 'email', value: 'jane@example.com' },
  { id: 'employee-title', label: /title/i, type: 'text', value: 'Engineer' },
  { id: 'employee-department', label: /department/i, type: 'text', value: 'IT' },
];

describe('EmployeeForm', () => {
  // The form saves its state to localStorage, so clear it to keep tests independent.
  beforeEach(() => {
    localStorage.clear();
  });

  test('each label is associated with an empty input of the right type', () => {
    render(<EmployeeForm />);

    fields.forEach(({ id, label, type }) => {
      const input = screen.getByLabelText(label);
      expect(input).toHaveAttribute('id', id);
      expect(input).toHaveAttribute('type', type);
      expect(input).toHaveValue('');
    });
  });

  test('renders a submit button', () => {
    render(<EmployeeForm />);
    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toHaveAttribute('type', 'submit');
  });

  test('updates each input as the user types', () => {
    render(<EmployeeForm />);

    fields.forEach(({ label, value }) => {
      const input = screen.getByLabelText(label);
      userEvent.type(input, value);
      expect(input).toHaveValue(value);
    });
  });

  test('typing in one field does not change the others', () => {
    render(<EmployeeForm />);

    userEvent.type(screen.getByLabelText(/name/i), 'Jane Doe');

    expect(screen.getByLabelText(/email/i)).toHaveValue('');
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/department/i)).toHaveValue('');
  });

  test('restores saved data and fills missing fields with empty strings', () => {
    localStorage.setItem('current_employee', JSON.stringify({ name: 'Jane Doe' }));
    render(<EmployeeForm />);

    expect(screen.getByLabelText(/name/i)).toHaveValue('Jane Doe');
    expect(screen.getByLabelText(/email/i)).toHaveValue('');
  });

  test.each(['not json', 'null'])('falls back to an empty form when saved data is %p', (bad) => {
    localStorage.setItem('current_employee', bad);
    render(<EmployeeForm />);

    expect(screen.getByLabelText(/name/i)).toHaveValue('');
  });

  test('submitting calls onSubmit with the form data and prevents a page reload', () => {
    const onSubmit = jest.fn();
    render(<EmployeeForm onSubmit={onSubmit} />);

    userEvent.type(screen.getByLabelText(/name/i), 'Jane Doe');
    const event = new Event('submit', { bubbles: true, cancelable: true });
    screen.getByRole('button', { name: /submit/i }).form.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Jane Doe', email: '', title: '', department: '',
    });
  });
});
