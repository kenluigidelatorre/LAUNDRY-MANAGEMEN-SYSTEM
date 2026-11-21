const customerRepository = require('../repositories/customerRepository');
const AppError = require('../utils/AppError');

async function listCustomers(req, res, next) {
  try {
    if (req.user.role === 'CUSTOMER') {
      const own = await customerRepository.getCustomerById(req.user.customerId);
      return res.json({ success: true, data: own ? [own] : [] });
    }
    const data = await customerRepository.listCustomers();
    return res.json({ success: true, data });
  } catch (err) {
    return next(err);
  }
}

async function createCustomer(req, res, next) {
  try {
    const data = await customerRepository.createCustomer(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateCustomer(req, res, next) {
  try {
    if (req.user.role === 'CUSTOMER' && req.params.id !== req.user.customerId) {
      return next(new AppError('Access denied. You can only update your own customer profile.', 403));
    }
    const payload =
      req.user.role === 'CUSTOMER'
        ? { ...req.body, status: 'Active' }
        : req.body;
    const data = await customerRepository.updateCustomer(req.params.id, payload);
    return res.json({ success: true, data });
  } catch (err) {
    return next(err);
  }
}

async function deleteCustomer(req, res, next) {
  try {
    const data = await customerRepository.deleteCustomer(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
