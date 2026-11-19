const staffRepository = require('../repositories/staffRepository');

async function listStaff(req, res, next) {
  try {
    const data = await staffRepository.listStaff();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function createStaff(req, res, next) {
  try {
    const data = await staffRepository.createStaff(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateStaff(req, res, next) {
  try {
    const data = await staffRepository.updateStaff(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function toggleStaffStatus(req, res, next) {
  try {
    const data = await staffRepository.toggleStaffStatus(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function deleteStaff(req, res, next) {
  try {
    const data = await staffRepository.deleteStaff(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listStaff,
  createStaff,
  updateStaff,
  toggleStaffStatus,
  deleteStaff,
};
