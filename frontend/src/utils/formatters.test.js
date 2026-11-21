
import { describe, it, expect } from 'vitest';
import {
  getInitials,
  getStockStatus,
  calculateOrderTotal,
} from './formatters';

describe('Frontend Utility Tests', () => {
  it('F-T1: should generate initials from a customer name', () => {
    expect(getInitials('Juan Dela Cruz')).toBe('JD');
  });

  it('F-T2: should correctly identify stock status', () => {
    expect(getStockStatus(0, 5)).toBe('Out of Stock');
    expect(getStockStatus(3, 5)).toBe('Low Stock');
    expect(getStockStatus(10, 5)).toBe('In Stock');
  });

  it('F-T3: should calculate the order total correctly', () => {
    expect(calculateOrderTotal(5, 50, 20, 10)).toBe(260);
  });
});
