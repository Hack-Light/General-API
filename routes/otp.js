const express = require("express");
const router = express.Router();

const otpController = require("../controller/otp");

router.post("/otp/send", otpController.send);
router.post("/otp/verify", otpController.verify);

module.exports = router;
