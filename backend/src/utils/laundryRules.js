const TRACKING_STAGES = [
  'Order Received',
  'Pending',
  'Washing',
  'Drying',
  'Folding',
  'Ready for Pickup',
  'Completed',
];

const VALID_STATUS_TRANSITIONS = {
  'Order Received': ['Pending', 'Washing', 'Cancelled'],
  Pending: ['Washing', 'Cancelled'],
  Washing: ['Drying', 'Cancelled'],
  Drying: ['Folding', 'Cancelled'],
  Folding: ['Ready for Pickup', 'Cancelled'],
  'Ready for Pickup': ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

function calculateMultiServiceTotal(lines, additionalCharges = 0, discount = 0) {
  const subtotal = lines.reduce(
    (sum, item) => sum + Number(item.weightKg) * Number(item.pricePerKg),
    0
  );
  const raw = subtotal + Number(additionalCharges || 0) - Number(discount || 0);
  return Math.max(0, Math.round(raw * 100) / 100);
}

function formatPHP(amount) {
  const safe = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return `₱${safe.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getInitials(name = '') {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => (part[0] ? part[0].toUpperCase() : ''))
    .join('');
}

module.exports = {
  TRACKING_STAGES,
  VALID_STATUS_TRANSITIONS,
  calculateMultiServiceTotal,
  formatPHP,
  getInitials,
};
