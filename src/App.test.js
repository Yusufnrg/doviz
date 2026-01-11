import { render, screen } from '@testing-library/react';
import App from './App';

test('renders borsa takip header', () => {
  render(<App />);
  const headerElement = screen.getByText(/Borsa Takip/i);
  expect(headerElement).toBeInTheDocument();
});
