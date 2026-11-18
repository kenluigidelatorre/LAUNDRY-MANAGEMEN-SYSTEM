const customerRepository = require('../repositories/customerRepository');

async function listCustomers(req, res, next) {
  try {
    const data = await customerRepository.listCustomers();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
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
    const data = await customerRepository.updateCustomer(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
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
