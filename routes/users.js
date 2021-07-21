const express = require("express");
const router = express.Router();
const auth = require("../auth/auth");
const userController = require("../controller/user");

router.get("/users/all", auth.verify, userController.getAllUsers);
router.get("/users/:id", auth.verify, userController.getOneUserAdmin);

router.delete("/users/delete/:id", auth.verify, userController.deleteUser);

module.exports = router;
