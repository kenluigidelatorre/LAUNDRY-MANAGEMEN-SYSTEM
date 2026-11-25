
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';

vi.mock('../context/AppContext', () => ({
  AppProvider: ({ children }) => children,
  useApp: () => ({
    user: null,
    authLoading: false,
    toasts: [],
    dismissToast: vi.fn(),
  }),
  getHomeRouteByRole: vi.fn(() => '/'),
}));

vi.mock('../pages/WelcomePage', () => ({
  WelcomePage: () => <h1>Welcome to Wash n' Dash</h1>,
}));

vi.mock('../components/common/UIPrimitives', () => ({
  ToastContainer: () => null,
}));

describe('App Component', () => {
  it('renders the welcome page for unauthenticated users', () => {
    window.history.pushState({}, '', '/');

    render(<App />);

    expect(
      screen.getByRole('heading', { name: "Welcome to Wash n' Dash" })
    ).toBeInTheDocument();
  });
});
