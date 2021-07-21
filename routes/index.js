let express = require("express");
let router = express.Router();
let messageModel = require("../models/message");

/* GET home page. */
router.get("/", async (req, res, next) => {
  let messages = await messageModel.find();
  console.log(messages);
  res.render("index", { messages });
});

router.get("/new", (req, res) => {
  res.render("add");
});

router.post("/new", async (req, res) => {
  let { name, message } = req.body;
  let newMessage = new messageModel({
    name,
    message
  });

  await newMessage.save();
  res.redirect("/");
});

module.exports = router;
