const express = require("express"),
  auth = require("../auth/auth"),
  crimeControler = require("../controller/crime"),
  multer = require("multer");

let storage = multer.memoryStorage();
let uploads = multer({ storage }).array("media", 5);
let { cloudConfig } = require("../controller/cloudinary");

let route = express.Router();

route.get("/", (req, res) => {
  res.redirect("https://documenter.getpostman.com/view/12631060/TVCiTmRJ");
});

route.post(
  "/crime/report",
  uploads,
  auth.verify,
  cloudConfig,
  crimeControler.report
);

route.get("/crime/all", auth.verify, crimeControler.getAll);
route.get("/crime/:id", auth.verify, crimeControler.getOne);

module.exports = route;
