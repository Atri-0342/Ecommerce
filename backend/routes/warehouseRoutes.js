const express = require("express");
const router = express.Router();
const warehouseController = require("../controllers/warehouseController");

// Path: /warehouses/... (No /api prefix used in server.js)
router.get("/all", warehouseController.getAllWarehouses);
router.post("/create", warehouseController.createWarehouse);
router.get("/nearest", warehouseController.getNearestWarehouse);
router.post("/update-stock", warehouseController.updateStock);
router.put("/:id", warehouseController.updateWarehouse);
router.delete("/:id", warehouseController.deleteWarehouse);
router.get("/get-coords", warehouseController.getCoordinates);
router.delete("/:id/inventory/:productId", warehouseController.removeSKU);
module.exports = router;