const { query, withTransaction } = require('../config/db');
const AppError = require('../utils/AppError');
const {
  TRACKING_STAGES,
  VALID_STATUS_TRANSITIONS,
  calculateMultiServiceTotal,
  formatPHP,
} = require('../utils/laundryRules');

function mapOrderRow(row, items = [], history = []) {
  const mappedItems = items.map((item) => ({
    serviceId: item.service_id,
    serviceName: item.service_name,
    weightKg: Number(item.weight_kg),
    pricePerKg: Number(item.price_per_kg),
    subtotal: Number(item.subtotal),
  }));

  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    contactNumber: row.contact_number,
    serviceId: mappedItems[0]?.serviceId || '',
    serviceName: row.service_summary,
    weightKg: Number(row.total_weight_kg),
    pricePerKg: mappedItems[0]?.pricePerKg || 0,
    services: mappedItems,
    additionalCharges: Number(row.additional_charges),
    discount: Number(row.discount),
    totalAmount: Number(row.total_amount),
    amountPaid: Number(row.amount_paid),
    remainingBalance: Number(row.remaining_balance),
    paymentStatus: row.payment_status,
    laundryStatus: row.laundry_status,
    dateReceived: row.date_received,
    expectedCompletionDate: row.expected_completion_date,
    assignedStaffId: row.assigned_staff_id,
    assignedStaffName: row.assigned_staff_name,
    specialInstructions: row.special_instructions || '',
    stageTimestamps: row.stage_timestamps || {},
    trackingHistory: history.map((h) => ({
      id: h.id,
      orderId: h.order_id,
      previousStatus: h.previous_status,
      newStatus: h.new_status,
      timestamp: h.created_at,
      staffName: h.staff_name,
      staffId: h.staff_id,
      remarks: h.remarks || undefined,
    })),
    updatedAt: row.updated_at,
  };
}

async function listOrders(filters = {}, user = null) {
  const conditions = [];
  const params = [];

  if (user && user.role === 'STAFF') {
    params.push(user.id);
    conditions.push(
      `(o.assigned_staff_id = $${params.length} OR o.laundry_status NOT IN ('Completed', 'Cancelled'))`
    );
  }

  if (filters.q) {
    params.push(`%${filters.q.trim()}%`);
    const idx = params.length;
    conditions.push(
      `(o.id ILIKE $${idx} OR c.full_name ILIKE $${idx} OR c.contact_number ILIKE $${idx} OR o.service_summary ILIKE $${idx})`
    );
  }
  if (filters.status && filters.status !== 'ALL') {
    params.push(filters.status);
    conditions.push(`o.laundry_status = $${params.length}`);
  }
  if (filters.paymentStatus && filters.paymentStatus !== 'ALL') {
    params.push(filters.paymentStatus);
    conditions.push(`o.payment_status = $${params.length}`);
  }
  if (filters.staffId && filters.staffId !== 'ALL') {
    params.push(filters.staffId);
    conditions.push(`o.assigned_staff_id = $${params.length}`);
  }
  if (filters.receivedDate) {
    params.push(filters.receivedDate);
    conditions.push(`DATE(o.date_received) = $${params.length}`);
  }
  if (filters.expectedDate) {
    params.push(filters.expectedDate);
    conditions.push(`DATE(o.expected_completion_date) = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows: orderRows } = await query(
    `SELECT o.*, c.full_name AS customer_name, c.contact_number, s.full_name AS assigned_staff_name
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     JOIN staff_users s ON s.id = o.assigned_staff_id
     ${whereClause}
     ORDER BY o.date_received DESC`,
    params
  );

  if (orderRows.length === 0) return [];

  const orderIds = orderRows.map((r) => r.id);
  const { rows: itemRows } = await query(
    `SELECT * FROM order_items WHERE order_id = ANY($1::varchar[]) ORDER BY id ASC`,
    [orderIds]
  );
  const { rows: historyRows } = await query(
    `SELECT * FROM order_tracking_history WHERE order_id = ANY($1::varchar[]) ORDER BY created_at ASC`,
    [orderIds]
  );

  const itemsByOrder = new Map();
  for (const it of itemRows) {
    if (!itemsByOrder.has(it.order_id)) itemsByOrder.set(it.order_id, []);
    itemsByOrder.get(it.order_id).push(it);
  }

  const historyByOrder = new Map();
  for (const h of historyRows) {
    if (!historyByOrder.has(h.order_id)) historyByOrder.set(h.order_id, []);
    historyByOrder.get(h.order_id).push(h);
  }

  return orderRows.map((row) =>
    mapOrderRow(row, itemsByOrder.get(row.id) || [], historyByOrder.get(row.id) || [])
  );
}

async function getOrderById(orderId, client = null) {
  const runner = client ? (t, p) => client.query(t, p) : query;
  const { rows } = await runner(
    `SELECT o.*, c.full_name AS customer_name, c.contact_number, s.full_name AS assigned_staff_name
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     JOIN staff_users s ON s.id = o.assigned_staff_id
     WHERE o.id = $1`,
    [orderId]
  );
  if (rows.length === 0) return null;

  const { rows: items } = await runner(
    `SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC`,
    [orderId]
  );
  const { rows: history } = await runner(
    `SELECT * FROM order_tracking_history WHERE order_id = $1 ORDER BY created_at ASC`,
    [orderId]
  );

  return mapOrderRow(rows[0], items, history);
}

async function createOrder(input, actor) {
  return withTransaction(async (client) => {
    const custRes = await client.query(
      `SELECT id, full_name, contact_number FROM customers WHERE id = $1`,
      [input.customerId]
    );
    if (custRes.rows.length === 0) {
      throw new AppError('Selected customer was not found.', 404);
    }
    const customer = custRes.rows[0];

    const staffIdToUse = input.assignedStaffId || actor.id;
    const staffRes = await client.query(
      `SELECT id, full_name FROM staff_users WHERE id = $1`,
      [staffIdToUse]
    );
    if (staffRes.rows.length === 0) {
      throw new AppError('Assigned staff member was not found.', 404);
    }
    const staffMember = staffRes.rows[0];

    // Resolve services from DB (deduplicate if same service sent twice)
    const serviceIds = [...new Set(input.services.map((s) => s.serviceId))];
    const srvRes = await client.query(
      `SELECT id, name, price_per_kg FROM laundry_services WHERE id = ANY($1::varchar[])`,
      [serviceIds]
    );
    const serviceMap = new Map(srvRes.rows.map((s) => [s.id, s]));

    const lines = [];
    for (const reqItem of input.services) {
      const srv = serviceMap.get(reqItem.serviceId);
      if (!srv) {
        throw new AppError(`Laundry service ${reqItem.serviceId} not found.`, 400);
      }
      const weightKg = Math.round(Number(reqItem.weightKg) * 10) / 10;
      const pricePerKg = Number(srv.price_per_kg);
      const subtotal = Math.round(weightKg * pricePerKg * 100) / 100;
      lines.push({
        serviceId: srv.id,
        serviceName: srv.name,
        weightKg,
        pricePerKg,
        subtotal,
      });
    }

    const totalWeightKg =
      Math.round(lines.reduce((s, l) => s + l.weightKg, 0) * 10) / 10;
    const serviceSummary = lines.map((l) => l.serviceName).join(' + ');
    const additionalCharges = Math.max(0, Number(input.additionalCharges || 0));
    const discount = Math.max(0, Number(input.discount || 0));
    const totalAmount = calculateMultiServiceTotal(lines, additionalCharges, discount);

    const initialPayment = Math.min(
      totalAmount,
      Math.max(0, Number(input.initialPayment || 0))
    );
    const remainingBalance =
      Math.max(0, Math.round((totalAmount - initialPayment) * 100) / 100);
    const paymentStatus =
      initialPayment >= totalAmount && totalAmount > 0
        ? 'Paid'
        : initialPayment > 0
        ? 'Partial Payment'
        : 'Unpaid';

    const maxIdRes = await client.query(
      `SELECT COALESCE(MAX(NULLIF(regexp_replace(id, '\\D', '', 'g'), '')::int), 1054) AS max_num FROM orders`
    );
    const orderId = `WD-${Number(maxIdRes.rows[0].max_num) + 1}`;
    const nowIso = new Date().toISOString();
    const stageTimestamps = { 'Order Received': nowIso };

    await client.query(
      `INSERT INTO orders (
        id, customer_id, assigned_staff_id, service_summary, total_weight_kg,
        additional_charges, discount, total_amount, amount_paid, remaining_balance,
        payment_status, laundry_status, date_received, expected_completion_date,
        special_instructions, stage_timestamps
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Order Received',$12,$13,$14,$15::jsonb)`,
      [
        orderId,
        customer.id,
        staffMember.id,
        serviceSummary,
        totalWeightKg,
        additionalCharges,
        discount,
        totalAmount,
        initialPayment,
        remainingBalance,
        paymentStatus,
        nowIso,
        input.expectedCompletionDate,
        input.specialInstructions || '',
        JSON.stringify(stageTimestamps),
      ]
    );

    for (const line of lines) {
      await client.query(
        `INSERT INTO order_items (order_id, service_id, service_name, weight_kg, price_per_kg, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          orderId,
          line.serviceId,
          line.serviceName,
          line.weightKg,
          line.pricePerKg,
          line.subtotal,
        ]
      );
    }

    const summaryNote = lines
      .map((l) => `${l.serviceName} (${l.weightKg} kg)`)
      .join(', ');

    await client.query(
      `INSERT INTO order_tracking_history (id, order_id, previous_status, new_status, staff_id, staff_name, remarks, created_at)
       VALUES ($1, $2, 'Created', 'Order Received', $3, $4, $5, $6)`,
      [
        `TRK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        orderId,
        actor.id,
        actor.name,
        `Order created: ${summaryNote}.`,
        nowIso,
      ]
    );

    let createdTransaction = null;
    if (initialPayment > 0) {
      const txnCountRes = await client.query(
        `SELECT COALESCE(MAX(NULLIF(regexp_replace(id, '\\D', '', 'g'), '')::int), 8900) AS max_num FROM payment_transactions`
      );
      const txnId = `TXN-${Number(txnCountRes.rows[0].max_num) + 1}`;
      const txnRes = await client.query(
        `INSERT INTO payment_transactions (
          id, order_id, customer_id, amount_paid, order_total, remaining_balance,
          payment_method, payment_status, processed_by_id, processed_by_name, reference_number, notes, payment_date
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [
          txnId,
          orderId,
          customer.id,
          initialPayment,
          totalAmount,
          remainingBalance,
          input.paymentMethod || 'Cash',
          paymentStatus,
          actor.id,
          actor.name,
          input.referenceNumber ? String(input.referenceNumber).trim() : null,
          initialPayment < totalAmount
            ? 'Initial partial payment upon drop-off'
            : 'Paid in full at drop-off',
          nowIso,
        ]
      );
      const tRow = txnRes.rows[0];
      createdTransaction = {
        id: tRow.id,
        orderId: tRow.order_id,
        customerId: tRow.customer_id,
        customerName: customer.full_name,
        amountPaid: Number(tRow.amount_paid),
        orderTotal: Number(tRow.order_total),
        remainingBalance: Number(tRow.remaining_balance),
        paymentMethod: tRow.payment_method,
        paymentDate: tRow.payment_date,
        paymentStatus: tRow.payment_status,
        processedBy: tRow.processed_by_name,
        referenceNumber: tRow.reference_number || undefined,
        notes: tRow.notes || undefined,
      };
    }

    await client.query(
      `INSERT INTO notifications (id, title, description, type, target_role, is_read, created_at)
       VALUES ($1, $2, $3, 'order', 'ALL', FALSE, $4)`,
      [
        `NTF-${Date.now()}`,
        `New Order ${orderId}`,
        `${customer.full_name} — ${serviceSummary} (${formatPHP(totalAmount)})`,
        nowIso,
      ]
    );

    const order = await getOrderById(orderId, client);
    return { order, transaction: createdTransaction };
  });
}

async function updateOrder(orderId, input) {
  return withTransaction(async (client) => {
    const existingRes = await client.query(
      `SELECT * FROM orders WHERE id = $1 FOR UPDATE`,
      [orderId]
    );
    if (existingRes.rows.length === 0) {
      throw new AppError(`Order ${orderId} not found.`, 404);
    }
    const existing = existingRes.rows[0];

    const staffRes = await client.query(
      `SELECT id FROM staff_users WHERE id = $1`,
      [input.assignedStaffId]
    );
    if (staffRes.rows.length === 0) {
      throw new AppError('Assigned staff member not found.', 404);
    }

    const serviceIds = [...new Set(input.services.map((s) => s.serviceId))];
    const srvRes = await client.query(
      `SELECT id, name, price_per_kg FROM laundry_services WHERE id = ANY($1::varchar[])`,
      [serviceIds]
    );
    const serviceMap = new Map(srvRes.rows.map((s) => [s.id, s]));

    const lines = [];
    for (const reqItem of input.services) {
      const srv = serviceMap.get(reqItem.serviceId);
      if (!srv) {
        throw new AppError(`Laundry service ${reqItem.serviceId} not found.`, 400);
      }
      const weightKg = Math.round(Number(reqItem.weightKg) * 10) / 10;
      const pricePerKg = Number(srv.price_per_kg);
      const subtotal = Math.round(weightKg * pricePerKg * 100) / 100;
      lines.push({
        serviceId: srv.id,
        serviceName: srv.name,
        weightKg,
        pricePerKg,
        subtotal,
      });
    }

    const totalWeightKg =
      Math.round(lines.reduce((s, l) => s + l.weightKg, 0) * 10) / 10;
    const serviceSummary = lines.map((l) => l.serviceName).join(' + ');
    const additionalCharges = Math.max(0, Number(input.additionalCharges || 0));
    const discount = Math.max(0, Number(input.discount || 0));
    const totalAmount = calculateMultiServiceTotal(lines, additionalCharges, discount);
    const amountPaid = Number(existing.amount_paid);
    const remainingBalance =
      Math.max(0, Math.round((totalAmount - amountPaid) * 100) / 100);
    const paymentStatus =
      remainingBalance <= 0 && totalAmount > 0
        ? 'Paid'
        : amountPaid > 0
        ? 'Partial Payment'
        : 'Unpaid';

    await client.query(
      `UPDATE orders
       SET assigned_staff_id = $2,
           service_summary = $3,
           total_weight_kg = $4,
           additional_charges = $5,
           discount = $6,
           total_amount = $7,
           remaining_balance = $8,
           payment_status = $9,
           expected_completion_date = $10,
           special_instructions = $11,
           updated_at = NOW()
       WHERE id = $1`,
      [
        orderId,
        input.assignedStaffId,
        serviceSummary,
        totalWeightKg,
        additionalCharges,
        discount,
        totalAmount,
        remainingBalance,
        paymentStatus,
        input.expectedCompletionDate,
        input.specialInstructions || '',
      ]
    );

    await client.query(`DELETE FROM order_items WHERE order_id = $1`, [orderId]);
    for (const line of lines) {
      await client.query(
        `INSERT INTO order_items (order_id, service_id, service_name, weight_kg, price_per_kg, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          orderId,
          line.serviceId,
          line.serviceName,
          line.weightKg,
          line.pricePerKg,
          line.subtotal,
        ]
      );
    }

    return getOrderById(orderId, client);
  });
}

async function updateOrderStatus(orderId, newStatus, remarks, actor) {
  return withTransaction(async (client) => {
    const res = await client.query(
      `SELECT o.*, c.full_name AS customer_name
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       WHERE o.id = $1 FOR UPDATE`,
      [orderId]
    );
    if (res.rows.length === 0) {
      throw new AppError(`Order ${orderId} not found.`, 404);
    }
    const target = res.rows[0];

    if (target.laundry_status === 'Completed' || target.laundry_status === 'Cancelled') {
      throw new AppError(
        `Order ${orderId} is already ${target.laundry_status} and cannot continue processing.`,
        400
      );
    }
    if (target.laundry_status === newStatus) {
      throw new AppError(`Order ${orderId} is already at ${newStatus}.`, 400);
    }

    const allowed = VALID_STATUS_TRANSITIONS[target.laundry_status] || [];
    const currentIdx = TRACKING_STAGES.indexOf(target.laundry_status);
    const nextIdx = TRACKING_STAGES.indexOf(newStatus);
    const isForwardStep = nextIdx > currentIdx && nextIdx !== -1;

    if (!allowed.includes(newStatus) && !isForwardStep) {
      throw new AppError(
        `Invalid transition from "${target.laundry_status}" to "${newStatus}".`,
        400
      );
    }

    const nowIso = new Date().toISOString();
    const updatedStages = { ...(target.stage_timestamps || {}) };
    if (nextIdx > currentIdx) {
      for (let i = currentIdx + 1; i <= nextIdx; i++) {
        const st = TRACKING_STAGES[i];
        if (!updatedStages[st]) updatedStages[st] = nowIso;
      }
    } else {
      updatedStages[newStatus] = nowIso;
    }

    await client.query(
      `UPDATE orders
       SET laundry_status = $2,
           stage_timestamps = $3::jsonb,
           updated_at = $4
       WHERE id = $1`,
      [orderId, newStatus, JSON.stringify(updatedStages), nowIso]
    );

    await client.query(
      `INSERT INTO order_tracking_history (id, order_id, previous_status, new_status, staff_id, staff_name, remarks, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        `TRK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        orderId,
        target.laundry_status,
        newStatus,
        actor.id,
        actor.name,
        remarks ? remarks.trim() : null,
        nowIso,
      ]
    );

    if (newStatus === 'Ready for Pickup') {
      await client.query(
        `INSERT INTO notifications (id, title, description, type, target_role, is_read, created_at)
         VALUES ($1, $2, $3, 'order', 'ALL', FALSE, $4)`,
        [
          `NTF-${Date.now()}`,
          `Ready for Pickup: ${orderId}`,
          `${target.customer_name}'s ${target.service_summary} is ready for pickup.`,
          nowIso,
        ]
      );
    }

    return getOrderById(orderId, client);
  });
}

async function assignStaff(orderId, staffId, remarks, actor) {
  return withTransaction(async (client) => {
    const orderRes = await client.query(`SELECT * FROM orders WHERE id = $1 FOR UPDATE`, [orderId]);
    if (orderRes.rows.length === 0) throw new AppError(`Order ${orderId} not found.`, 404);

    const staffRes = await client.query(`SELECT id, full_name FROM staff_users WHERE id = $1`, [staffId]);
    if (staffRes.rows.length === 0) throw new AppError('Staff member not found.', 404);

    const staffMember = staffRes.rows[0];
    const nowIso = new Date().toISOString();

    await client.query(
      `UPDATE orders SET assigned_staff_id = $2, updated_at = $3 WHERE id = $1`,
      [orderId, staffMember.id, nowIso]
    );

    await client.query(
      `INSERT INTO order_tracking_history (id, order_id, previous_status, new_status, staff_id, staff_name, remarks, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        `TRK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        orderId,
        orderRes.rows[0].laundry_status,
        orderRes.rows[0].laundry_status,
        actor.id,
        actor.name,
        remarks || `Assigned order to ${staffMember.full_name}.`,
        nowIso,
      ]
    );

    return getOrderById(orderId, client);
  });
}

async function updateExpectedDate(orderId, expectedCompletionDate) {
  const { rowCount } = await query(
    `UPDATE orders SET expected_completion_date = $2, updated_at = NOW() WHERE id = $1`,
    [orderId, expectedCompletionDate]
  );
  if (rowCount === 0) throw new AppError(`Order ${orderId} not found.`, 404);
  return getOrderById(orderId);
}

async function deleteOrder(orderId) {
  const { rowCount } = await query(`DELETE FROM orders WHERE id = $1`, [orderId]);
  if (rowCount === 0) throw new AppError(`Order ${orderId} not found.`, 404);
  return { id: orderId };
}

module.exports = {
  listOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  assignStaff,
  updateExpectedDate,
  deleteOrder,
};
