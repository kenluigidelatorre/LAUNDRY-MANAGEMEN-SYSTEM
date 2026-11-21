
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { OrdersPage } from './OrdersPage';

vi.mock('../../context/AppContext', () => ({
  useApp: vi.fn(),
}));

// Keep the tests focused on the Orders page.
vi.mock('../../components/orders/OrderFormModal', () => ({
  OrderFormModal: () => null,
}));

vi.mock('../../components/orders/OrderDetailsModal', () => ({
  OrderDetailsModal: () => null,
}));

vi.mock('../../components/tracking/OrderProgressTracker', () => ({
  OrderTrackingModal: () => null,
}));

vi.mock('../../components/payments/RecordPaymentModal', () => ({
  RecordPaymentModal: () => null,
}));

vi.mock('../../components/common/ReceiptModal', () => ({
  ReceiptModal: () => null,
}));

const sampleOrder = {
  id: 'WD-TEST-001',
  customerName: 'Maria Santos',
  contactNumber: '09123456789',
  serviceName: 'Wash and Fold',
  weightKg: 5,
  totalAmount: 250,
  remainingBalance: 100,
  paymentStatus: 'PARTIAL',
  laundryStatus: 'Washing',
  assignedStaffId: 'STAFF-001',
  assignedStaffName: 'Juan Staff',
  dateReceived: '2026-11-20T09:00:00',
  expectedCompletionDate: '2026-12-01T17:00:00',
};

const renderOrdersPage = () =>
  render(
    <MemoryRouter>
      <OrdersPage mode="admin" />
    </MemoryRouter>
  );

describe('OrdersPage Component Tests', () => {
  beforeEach(() => {
    useApp.mockReturnValue({
      user: { id: 'ADMIN-001' },
      orders: [sampleOrder],
      staff: [],
      cancelOrder: vi.fn(),
      updateOrderStatus: vi.fn(),
    });
  });

  it('F-T1: should display the correct Orders page heading', () => {
    renderOrdersPage();

    expect(
      screen.getByRole('heading', { name: 'All Laundry Orders' })
    ).toBeInTheDocument();
  });

  it('F-T2: should filter orders when the user types in the search field', () => {
    renderOrdersPage();

    expect(screen.getByText('Maria Santos')).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText(
        'Search by Order ID, Customer Name, or Contact...'
      ),
      { target: { value: 'No Matching Customer' } }
    );

    expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'No laundry orders found' })
    ).toBeInTheDocument();
  });

  it('F-T3: should display an empty state when there are no orders', () => {
    useApp.mockReturnValue({
      user: { id: 'ADMIN-001' },
      orders: [],
      staff: [],
      cancelOrder: vi.fn(),
      updateOrderStatus: vi.fn(),
    });

    renderOrdersPage();

    expect(
      screen.getByRole('heading', { name: 'No laundry orders found' })
    ).toBeInTheDocument();
  });
});
