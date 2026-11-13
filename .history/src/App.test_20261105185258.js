import { render, screen } from '@testing-library/react';
import App from './App';
import '@testing-library/jest-dom';


test('render Employee Form', () => {
  render(<App />);
  const linkElement = screen.getByText(/Employee Form/i);
  expect(linkElement).toBeInTheDocument();
});
