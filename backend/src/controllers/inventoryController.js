const inventoryRepository = require('../repositories/inventoryRepository');

async function listInventory(req, res, next) {
  try {
    const data = await inventoryRepository.listInventory();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function createInventoryItem(req, res, next) {
  try {
    const data = await inventoryRepository.createInventoryItem(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateInventoryItem(req, res, next) {
  try {
    const data = await inventoryRepository.updateInventoryItem(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateStock(req, res, next) {
  try {
    const { deltaOrExact, mode } = req.body;
    const data = await inventoryRepository.updateStock(
      req.params.id,
      deltaOrExact,
      mode || 'delta'
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function archiveInventoryItem(req, res, next) {
  try {
    const data = await inventoryRepository.archiveInventoryItem(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listInventory,
  createInventoryItem,
  updateInventoryItem,
  updateStock,
  archiveInventoryItem,
};
