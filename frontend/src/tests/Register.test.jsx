
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../pages/auth/Login';

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    user: null,
    login: vi.fn(),
    registerCustomer: vi.fn(),
    notify: vi.fn(),
  }),
  getHomeRouteByRole: vi.fn(() => '/'),
}));

describe('Registration Form', () => {
  it('renders the customer registration fields', () => {
    render(
      <MemoryRouter initialEntries={['/login?mode=register']}>
        <Login />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: 'Register an Account' })
    ).toBeInTheDocument();

    expect(screen.getByLabelText('Full Name'))
      .toBeInTheDocument();

    expect(screen.getByLabelText(/Gmail \/ Email Address/i))
      .toBeInTheDocument();

    expect(screen.getByLabelText('Contact Number'))
      .toBeInTheDocument();

    expect(screen.getByLabelText('Address'))
      .toBeInTheDocument();

    expect(screen.getByLabelText('Password'))
      .toBeInTheDocument();

    expect(screen.getByLabelText('Confirm Password'))
      .toBeInTheDocument();
  });
});
