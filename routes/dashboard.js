const express = require("express");
const router = express.Router();
const auth = require("../auth/auth");
const dashboardController = require("../controller/dashboard");

router.get("/dashboard", auth.verify, dashboardController.adminDashboard);

module.exports = router;
