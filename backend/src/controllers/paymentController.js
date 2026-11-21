const paymentRepository = require('../repositories/paymentRepository');

async function listTransactions(req, res, next) {
  try {
    const data = await paymentRepository.listTransactions(req.user);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function recordPayment(req, res, next) {
  try {
    const transaction = await paymentRepository.recordPayment(req.body, req.user);
    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
}

async function updateTransaction(req, res, next) {
  try {
    const transaction = await paymentRepository.updateTransaction(
      req.params.id,
      req.body
    );
    res.json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTransactions,
  recordPayment,
  updateTransaction,
};
