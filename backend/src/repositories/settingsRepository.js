const { query } = require('../config/db');

function mapSettings(row) {
  return {
    businessName: row.business_name,
    contactNumber: row.contact_number,
    address: row.address,
    email: row.email,
    currency: row.currency,
    receiptHeader: row.receipt_header,
    receiptFooter: row.receipt_footer,
    includeStaffOnReceipt: Boolean(row.include_staff_on_receipt),
    includePaymentBreakdown: Boolean(row.include_payment_breakdown),
    autoLowStockAlerts: Boolean(row.auto_low_stock_alerts),
  };
}

async function getSettings() {
  const { rows } = await query(`SELECT * FROM business_settings WHERE id = 1`);
  if (rows.length === 0) {
    return {
      businessName: "Wash n' Dash",
      contactNumber: '+63 2 8842 9100',
      address: '128 Jupiter Street, Bel-Air, Makati City, Metro Manila 1209',
      email: 'hello@washndash.ph',
      currency: 'PHP',
      receiptHeader: 'Fresh, Fast & Reliable Laundry Care',
      receiptFooter:
        "Thank you for choosing Wash n' Dash! Please present this receipt upon pickup.",
      includeStaffOnReceipt: true,
      includePaymentBreakdown: true,
      autoLowStockAlerts: true,
    };
  }
  return mapSettings(rows[0]);
}

async function updateSettings(data) {
  const { rows } = await query(
    `INSERT INTO business_settings (
       id, business_name, contact_number, address, email, currency,
       receipt_header, receipt_footer, include_staff_on_receipt,
       include_payment_breakdown, auto_low_stock_alerts, updated_at
     ) VALUES (1, 'Wash n'' Dash', $1, $2, $3, 'PHP', $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (id) DO UPDATE SET
       business_name = 'Wash n'' Dash',
       contact_number = EXCLUDED.contact_number,
       address = EXCLUDED.address,
       email = EXCLUDED.email,
       currency = 'PHP',
       receipt_header = EXCLUDED.receipt_header,
       receipt_footer = EXCLUDED.receipt_footer,
       include_staff_on_receipt = EXCLUDED.include_staff_on_receipt,
       include_payment_breakdown = EXCLUDED.include_payment_breakdown,
       auto_low_stock_alerts = EXCLUDED.auto_low_stock_alerts,
       updated_at = NOW()
     RETURNING *`,
    [
      data.contactNumber.trim(),
      data.address.trim(),
      data.email.trim(),
      data.receiptHeader.trim(),
      data.receiptFooter.trim(),
      Boolean(data.includeStaffOnReceipt),
      Boolean(data.includePaymentBreakdown),
      Boolean(data.autoLowStockAlerts),
    ]
  );
  return mapSettings(rows[0]);
}

module.exports = {
  getSettings,
  updateSettings,
};
