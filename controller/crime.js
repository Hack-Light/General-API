const crimeSchema = require("../models/crime");
const userSchema = require("../models/user");
const DataUri = require("datauri/parser");
const path = require("path");
const cloudinary = require("cloudinary");
const engagespotInstance = require("../controller/notification");

exports.report = async (req, res, next) => {
  let user = req.user.phone_number;
  let crimeType = req.body.type;
  let crimeTxt = req.body.text;
  let address = req.body.address;
  let dtUri = new DataUri();

  try {
    console.log(req.ipInfo);
    if (!crimeTxt && !crimeType) {
      return res.status(404).json({
        success: false,
        message: "Fill the required fields",
        error: {
          statusCode: 400,
          description: "Fill the required fields"
        }
      });
    }

    user = await userSchema.findOne({ phone: user });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: {
          statusCode: 404,
          description: "User not found"
        }
      });
    }
    // get admin id to send notification
    let admins = (await userSchema.find({ role: "super_admin" })).reduce(
      (acc, curr) => {
        return [...acc, curr._id];
      },
      []
    );

    console.log(admins);

    let crime_reporter = user._id;

    let crime = {
      text: crimeTxt,
      crimeType: crimeType,
      reporter: crime_reporter,
      address: address
    };

    if (!req.files || req.files.length <= 0) {
      return res.status(404).json({
        success: false,
        message: "Provide evidence of crime",
        error: {
          statusCode: 400,
          description: "Provide evidence of crime"
        }
      });
    }

    crime.evidence = [];

    for (const file of req.files) {
      let dataUri = dtUri.format(path.extname(file.originalname), file.buffer);

      let final_file = dataUri.content;

      let media = await cloudinary.v2.uploader.upload_large(final_file);

      crime.evidence.push({
        url: media.secure_url,
        public_id: media.public_id
      });
    }

    let savedCrime = await crimeSchema.create(crime);

    await engagespotInstance
      .setMessage({
        campaign_name: "Crime Notification",
        notification: {
          title: "ALERT! ALERT!! ALERT!!!",
          message: "New Crime Report",
          icon: "",
          url: `${host}/crime/${savedCrime._id}`
        },
        send_to: "identifiers"
      })
      .addIdentifiers(admins)
      .send();

    return res.status(201).json({
      success: true,
      message: "Crime reported successfully.",
      data: {
        statusCode: 200
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      error: {
        statusCode: 500,
        description: err
      }
    });
  }
};

exports.getAll = async (req, res, next) => {
  try {
    let { phone_number, role } = req.user;
    let user = await userSchema.findOne({ phone: phone_number });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: {
          statusCode: 404,
          description: "User not found"
        }
      });
    }

    if (role !== "super_admin") {
      return res.status(401).json({
        success: false,
        message: "Unauthorised Access",
        error: {
          statusCode: 401,
          description: "Unauthorised Access"
        }
      });
    }

    let crimes = await crimeSchema.find().populate("reporter", "phone").exec();

    return res.status(200).json({
      success: true,
      message: "success",
      data: {
        statusCode: 200,
        data: crimes
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      error: {
        statusCode: 500,
        description: err
      }
    });
  }
};

exports.getOne = async (req, res, next) => {
  let user = req.user.phone_number;

  let id = req.params;

  user = await userSchema.findOne({ phone: user });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      error: {
        statusCode: 404,
        description: "User not found"
      }
    });
  }

  if (user.role !== "super_admin") {
    return res.status(401).json({
      success: false,
      message: "Unauthorised Access",
      error: {
        statusCode: 401,
        description: "Unauthorised Access"
      }
    });
  }

  let crime = await crimeSchema.findById(id).populate("repoter", "phone");

  return res.status(200).json({
    success: true,
    message: "success",
    data: {
      crime
    }
  });
};
