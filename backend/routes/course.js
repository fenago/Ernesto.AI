// packages
const express = require("express");
// controller
const CourseController = require("../controllers/course");

// router constructor has been called
const router = express.Router();

// routes
router.get("/", CourseController.retrieveAll);
router.post("/", CourseController.create);
router.get("/:id", CourseController.retrieve);
router.patch("/:id", CourseController.update);
router.delete("/:id", CourseController.destroy);
router.get("/seed", CourseController.seed);

module.exports = router;
