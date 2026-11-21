const orderRepository = require('../repositories/orderRepository');
const AppError = require('../utils/AppError');

async function listOrders(req, res, next) {
  try {
    const orders = await orderRepository.listOrders(req.query, req.user);
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const order = await orderRepository.getOrderById(req.params.id);
    if (!order) return next(new AppError(`Order ${req.params.id} not found.`, 404));
    if (req.user.role === 'CUSTOMER' && order.customerId !== req.user.customerId) {
      return next(new AppError('Access denied. You can only view your own orders.', 403));
    }
    return res.json({ success: true, data: order });
  } catch (err) {
    return next(err);
  }
}

async function createOrder(req, res, next) {
  try {
    const { order, transaction } = await orderRepository.createOrder(req.body, req.user);
    res.status(201).json({
      success: true,
      data: order,
      transaction,
    });
  } catch (err) {
    next(err);
  }
}

async function updateOrder(req, res, next) {
  try {
    const order = await orderRepository.updateOrder(req.params.id, req.body);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status, remarks } = req.body;
    if (!status) return next(new AppError('New status is required.', 400));
    const order = await orderRepository.updateOrderStatus(
      req.params.id,
      status,
      remarks,
      req.user
    );
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function assignStaff(req, res, next) {
  try {
    const { staffId, remarks } = req.body;
    if (!staffId) return next(new AppError('staffId is required.', 400));
    const order = await orderRepository.assignStaff(
      req.params.id,
      staffId,
      remarks,
      req.user
    );
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function updateExpectedDate(req, res, next) {
  try {
    const { expectedCompletionDate } = req.body;
    if (!expectedCompletionDate) {
      return next(new AppError('expectedCompletionDate is required.', 400));
    }
    const order = await orderRepository.updateExpectedDate(
      req.params.id,
      expectedCompletionDate
    );
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function cancelOrder(req, res, next) {
  try {
    if (req.user.role === 'CUSTOMER') {
      const existing = await orderRepository.getOrderById(req.params.id);
      if (!existing) {
        return next(new AppError(`Order ${req.params.id} not found.`, 404));
      }
      if (existing.customerId !== req.user.customerId) {
        return next(new AppError('Access denied. You can only cancel your own orders.', 403));
      }
      if (!['Order Received', 'Pending'].includes(existing.laundryStatus)) {
        return next(
          new AppError(
            `Order ${req.params.id} is already "${existing.laundryStatus}" and can no longer be cancelled online.`,
            400
          )
        );
      }
    }

    const reason =
      req.body?.reason ||
      (req.user.role === 'CUSTOMER' ? 'Cancelled by customer before washing' : 'Cancelled by administrator');

    const order = await orderRepository.updateOrderStatus(
      req.params.id,
      'Cancelled',
      reason,
      req.user
    );
    return res.json({ success: true, data: order });
  } catch (err) {
    return next(err);
  }
}

async function deleteOrder(req, res, next) {
  try {
    const result = await orderRepository.deleteOrder(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  updateStatus,
  assignStaff,
  updateExpectedDate,
  cancelOrder,
  deleteOrder,
};
