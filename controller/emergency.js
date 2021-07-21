const emergencySchema = require("../models/emergency");
const userSchema = require("../models/user");
const DataUri = require("datauri/parser");
const path = require("path");
const cloudinary = require("cloudinary");
const unirest = require("unirest");
const geocoder = require("../util/geocoder");

exports.getOneUserAdminLocation = (req, res) => {
  const apiCall = unirest(
    "GET",
    "https://ip-geolocation-ipwhois-io.p.rapidapi.com/json/"
  );
  apiCall.headers({
    x_rapidapi_host: process.env.X_RAPIDAPI_HOST,
    x_rapidapi_key: process.env.X_RAPIAPI_KEY,
    useQueryString: true
  });
  apiCall.end(function (result) {
    if (res.error) throw new Error(result.error);
    console.log(result.body);
    res.send(result.body);
  });
};

exports.update = async (req, res) => {
  let dtUri = new DataUri();
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
};

exports.emergencyReport = async (req, res, next) => {
  let user = req.user.phone_number;
  let { latitude, longitude } = req.body;

  try {
    user = await userSchema.findOne({ phone: user });

    /*  const URL = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}location_type=ROOFTOP&result_type=street_address&key=${process.env.GEOCODER_API}` */

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

    let loc = await geocoder.reverse({
      lat: latitude,
      lon: longitude
    });
    console.log(geocodedResult);
    let emergency_reporter = user._id;

    let emergency = {
      reporter: emergency_reporter,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
        formattedAddress: loc[0].formattedAddress,
        country: loc[0].country,
        city: loc[0].city,
        street: loc[0].streetName
      }
    };

    await emergencySchema.create(emergency);

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

  let emergency = await emergencySchema
    .findById(id)
    .populate("repoter", "phone");

  return res.status(200).json({
    success: true,
    message: "success",
    data: {
      emergency
    }
  });
};
