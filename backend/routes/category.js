// packages
const express = require("express");
// controller
const CategoryController = require("../controllers/category");

// router constructor has been called
const router = express.Router();

// routes
router.get("/", CategoryController.retrieveAll);
router.post("/", CategoryController.create);
router.get("/:id", CategoryController.retrieve);
router.patch("/:id", CategoryController.update);
router.delete("/:id", CategoryController.destroy);
router.get("/seed", CategoryController.seed);

module.exports = router;
