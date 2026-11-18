export const TRACKING_STAGES = [
  'Order Received',
  'Pending',
  'Washing',
  'Drying',
  'Folding',
  'Ready for Pickup',
  'Completed',
];

/**
 * Formats a number in official Philippine Peso (₱) currency format.
 * Strictly uses ₱ symbol (never $ or USD).
 */
export function formatPHP(amount) {
  const safe = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return `₱${safe.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPHPCompact(amount) {
  const safe = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  if (safe >= 1000) {
    return `₱${(safe / 1000).toFixed(safe % 1000 === 0 ? 0 : 1)}k`;
  }
  return `₱${safe.toFixed(0)}`;
}

export function formatDateTime(isoOrString) {
  if (!isoOrString) return '—';
  const d = new Date(isoOrString);
  if (Number.isNaN(d.getTime())) return isoOrString;
  return d.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateOnly(isoOrString) {
  if (!isoOrString) return '—';
  const d = new Date(isoOrString);
  if (Number.isNaN(d.getTime())) return isoOrString;
  return d.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTimeOnly(isoOrString) {
  if (!isoOrString) return '—';
  const d = new Date(isoOrString);
  if (Number.isNaN(d.getTime())) return isoOrString;
  return d.toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function getInitials(name = '') {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Automatically detects whether an order is delayed.
 * Rule: Past expectedCompletionDate AND NOT Completed or Cancelled.
 */
export function isOrderDelayed(order, referenceNow = new Date()) {
  if (!order || order.laundryStatus === 'Completed' || order.laundryStatus === 'Cancelled') {
    return false;
  }
  const expected = new Date(order.expectedCompletionDate);
  if (Number.isNaN(expected.getTime())) return false;
  return referenceNow.getTime() > expected.getTime();
}

export function isSameDay(isoA, dateB = new Date()) {
  const a = new Date(isoA);
  if (Number.isNaN(a.getTime())) return false;
  return (
    a.getFullYear() === dateB.getFullYear() &&
    a.getMonth() === dateB.getMonth() &&
    a.getDate() === dateB.getDate()
  );
}

export function getStockStatus(quantity, minThreshold) {
  if (quantity <= 0) return 'Out of Stock';
  if (quantity <= minThreshold) return 'Low Stock';
  return 'In Stock';
}

export const VALID_STATUS_TRANSITIONS = {
  'Order Received': ['Pending', 'Washing', 'Cancelled'],
  Pending: ['Washing', 'Cancelled'],
  Washing: ['Drying', 'Cancelled'],
  Drying: ['Folding', 'Cancelled'],
  Folding: ['Ready for Pickup', 'Cancelled'],
  'Ready for Pickup': ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

export function getNextRecommendedStatus(current) {
  const map = {
    'Order Received': 'Pending',
    Pending: 'Washing',
    Washing: 'Drying',
    Drying: 'Folding',
    Folding: 'Ready for Pickup',
    'Ready for Pickup': 'Completed',
  };
  return map[current] ?? null;
}

export function calculateOrderTotal(weightKg, pricePerKg, additionalCharges, discount) {
  const raw = Number(weightKg) * Number(pricePerKg) + Number(additionalCharges) - Number(discount);
  return Math.max(0, Math.round(raw * 100) / 100);
}

export function calculateMultiServiceTotal(lines, additionalCharges, discount) {
  const subtotal = (lines || []).reduce(
    (sum, item) => sum + Number(item.weightKg) * Number(item.pricePerKg),
    0
  );
  const raw = subtotal + Number(additionalCharges || 0) - Number(discount || 0);
  return Math.max(0, Math.round(raw * 100) / 100);
}

export function getOrderServiceLines(order) {
  if (!order) return [];
  if (order.services && order.services.length > 0) {
    return order.services;
  }
  return [
    {
      serviceId: order.serviceId,
      serviceName: order.serviceName,
      weightKg: order.weightKg,
      pricePerKg: order.pricePerKg,
      subtotal: Math.round(order.weightKg * order.pricePerKg * 100) / 100,
    },
  ];
}
