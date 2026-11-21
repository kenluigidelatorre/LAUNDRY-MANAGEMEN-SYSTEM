const orderRepository = require('../repositories/orderRepository');
const customerRepository = require('../repositories/customerRepository');
const serviceRepository = require('../repositories/serviceRepository');
const staffRepository = require('../repositories/staffRepository');
const paymentRepository = require('../repositories/paymentRepository');
const inventoryRepository = require('../repositories/inventoryRepository');
const settingsRepository = require('../repositories/settingsRepository');
const notificationRepository = require('../repositories/notificationRepository');

async function getBootstrapData(req, res, next) {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    const isCustomer = req.user.role === 'CUSTOMER';

    const [
      orders,
      customers,
      services,
      staff,
      transactions,
      inventory,
      settings,
      notifications,
    ] = await Promise.all([
      orderRepository.listOrders({}, req.user),
      isCustomer
        ? customerRepository.getCustomerById(req.user.customerId).then((c) => (c ? [c] : []))
        : customerRepository.listCustomers(),
      serviceRepository.listServices(),
      isCustomer ? Promise.resolve([]) : staffRepository.listStaff(),
      paymentRepository.listTransactions(req.user),
      isAdmin ? inventoryRepository.listInventory() : Promise.resolve([]),
      settingsRepository.getSettings(),
      notificationRepository.listNotifications(req.user),
    ]);

    res.json({
      success: true,
      data: {
        orders,
        customers,
        services,
        staff,
        transactions,
        inventory,
        settings,
        notifications,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBootstrapData,
};
