const { query, withTransaction } = require('../config/db');
const AppError = require('../utils/AppError');
const { formatPHP } = require('../utils/laundryRules');

function mapTxn(row) {
  return {
    id: row.id,
    orderId: row.order_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    amountPaid: Number(row.amount_paid),
    orderTotal: Number(row.order_total),
    remainingBalance: Number(row.remaining_balance),
    paymentMethod: row.payment_method,
    paymentDate: row.payment_date,
    paymentStatus: row.payment_status,
    processedBy: row.processed_by_name,
    referenceNumber: row.reference_number || undefined,
    notes: row.notes || undefined,
  };
}

async function listTransactions() {
  const { rows } = await query(
    `SELECT pt.*, c.full_name AS customer_name
     FROM payment_transactions pt
     JOIN customers c ON c.id = pt.customer_id
     ORDER BY pt.payment_date DESC`
  );
  return rows.map(mapTxn);
}

async function recordPayment(input, actor) {
  return withTransaction(async (client) => {
    const orderRes = await client.query(
      `SELECT o.*, c.full_name AS customer_name
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       WHERE o.id = $1 FOR UPDATE`,
      [input.orderId]
    );
    if (orderRes.rows.length === 0) {
      throw new AppError(`Order ${input.orderId} not found.`, 404);
    }
    const order = orderRes.rows[0];

    if (order.laundry_status === 'Cancelled') {
      throw new AppError('Cannot record payment for a cancelled order.', 400);
    }

    const remainingBefore = Number(order.remaining_balance);
    const amount = Number(input.amount);
    if (amount <= 0) {
      throw new AppError('Payment amount must be greater than ₱0.00.', 400);
    }
    if (amount > remainingBefore + 0.01) {
      throw new AppError(
        `Amount exceeds remaining balance of ${formatPHP(remainingBefore)}.`,
        400
      );
    }

    const appliedAmount = Math.min(remainingBefore, Math.round(amount * 100) / 100);
    const newPaid = Math.round((Number(order.amount_paid) + appliedAmount) * 100) / 100;
    const totalAmount = Number(order.total_amount);
    const newBalance = Math.max(0, Math.round((totalAmount - newPaid) * 100) / 100);
    const paymentStatus =
      newBalance <= 0 ? 'Paid' : newPaid > 0 ? 'Partial Payment' : 'Unpaid';

    const nowIso = new Date().toISOString();

    await client.query(
      `UPDATE orders
       SET amount_paid = $2,
           remaining_balance = $3,
           payment_status = $4,
           updated_at = $5
       WHERE id = $1`,
      [order.id, newPaid, newBalance, paymentStatus, nowIso]
    );

    const maxRes = await client.query(
      `SELECT COALESCE(MAX(NULLIF(regexp_replace(id, '\\D', '', 'g'), '')::int), 8900) AS max_num FROM payment_transactions`
    );
    const txnId = `TXN-${Number(maxRes.rows[0].max_num) + 1}`;

    const txnRes = await client.query(
      `INSERT INTO payment_transactions (
        id, order_id, customer_id, amount_paid, order_total, remaining_balance,
        payment_method, payment_status, processed_by_id, processed_by_name,
        reference_number, notes, payment_date
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *`,
      [
        txnId,
        order.id,
        order.customer_id,
        appliedAmount,
        totalAmount,
        newBalance,
        input.method,
        paymentStatus,
        actor.id,
        actor.name,
        input.referenceNumber ? input.referenceNumber.trim() : null,
        input.notes ? input.notes.trim() : null,
        nowIso,
      ]
    );

    await client.query(
      `INSERT INTO notifications (id, title, description, type, target_role, is_read, created_at)
       VALUES ($1, $2, $3, 'payment', 'ALL', FALSE, $4)`,
      [
        `NTF-${Date.now()}`,
        `Payment Recorded: ${order.id}`,
        `${formatPHP(appliedAmount)} received via ${input.method}.`,
        nowIso,
      ]
    );

    const row = { ...txnRes.rows[0], customer_name: order.customer_name };
    return mapTxn(row);
  });
}

async function updateTransaction(id, patch) {
  const { rows } = await query(
    `UPDATE payment_transactions
     SET payment_method = COALESCE($2, payment_method),
         reference_number = $3,
         notes = $4
     WHERE id = $1
     RETURNING *`,
    [
      id,
      patch.paymentMethod || null,
      patch.referenceNumber ? patch.referenceNumber.trim() : null,
      patch.notes ? patch.notes.trim() : null,
    ]
  );
  if (rows.length === 0) throw new AppError(`Transaction ${id} not found.`, 404);

  const custRes = await query(`SELECT full_name FROM customers WHERE id = $1`, [
    rows[0].customer_id,
  ]);
  return mapTxn({
    ...rows[0],
    customer_name: custRes.rows[0]?.full_name || '',
  });
}

module.exports = {
  listTransactions,
  recordPayment,
  updateTransaction,
};
