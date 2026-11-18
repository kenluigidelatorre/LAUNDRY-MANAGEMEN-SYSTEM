const serviceRepository = require('../repositories/serviceRepository');

async function listServices(req, res, next) {
  try {
    const data = await serviceRepository.listServices();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function createService(req, res, next) {
  try {
    const data = await serviceRepository.createService(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateService(req, res, next) {
  try {
    const data = await serviceRepository.updateService(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function toggleServiceStatus(req, res, next) {
  try {
    const data = await serviceRepository.toggleServiceStatus(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function deleteService(req, res, next) {
  try {
    const data = await serviceRepository.deleteService(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listServices,
  createService,
  updateService,
  toggleServiceStatus,
  deleteService,
};
