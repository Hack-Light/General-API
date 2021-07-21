const Posts = require("../models/post"),
  Users = require("../models/user"),
  Crimes = require("../models/crime"),
  Emergencies = require("../models/emergency");
const emergency = require("../models/emergency");

const utils = {
  compareObjects: (a, b) => {
    //compares two time stamps and places the earlier timestamp before the other
    if (a.createdAt.getTime() > b.createdAt.getTime()) return -1;
    if (b.createdAt.getTime() < a.createdAt.getTime()) return 1;

    return 0;
  },

  getCrimesForMonth: (obj, data) => {
    const crimeDate = new Date(obj.time);
    const currentDate = new Date();
    try {
      if (currentDate.getFullYear() == crimeDate.getFullYear()) {
        data[crimeDate.getMonth()] += 1;
      }
    } catch (err) {
      console.log(err.message);
    }
    return data;
  },
  getEmergenciesForMonth: (obj, data) => {
    const emergencyDate = new Date(obj.date);
    const currentDate = new Date();
    try {
      if (currentDate.getFullYear() == emergencyDate.getFullYear()) {
        data[emergencyDate.getMonth()] += 1;
      }
    } catch (err) {
      console.log(err.message);
    }
    return data;
  }
};

exports.adminDashboard = async (req, res, next) => {
  const { phone_number } = req.user;

  const user = await Users.findOne({ phone: phone_number });

  //   check if user exists
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      error: {
        statusCode: 404,
        message: "User not found"
      }
    });
  }

  //   check if user is a super admin
  if (user.role !== "super_admin") {
    return res.status(401).json({
      success: false,
      message: "Unauthorised, resource can only accessed by Super Admin",
      error: {
        statusCode: 401,
        message: "Unauthorised, resource can only accessed by Super Admin"
      }
    });
  }
  try {
    let users = await Users.find({ role: "user" }).select("-password");
    let crimes = await Crimes.find({});
    let posts = await Posts.find({});
    let emergencies = await Emergencies.find({});

    let data = {};
    data.postsCount = users.length;
    data.crimesCount = crimes.length;
    data.emergenciesCount = emergencies.length;
    data.postsCount = posts.length;
    data.crimeChart = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    data.emergencyChart = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    // this gets the recent posts up to 15 of them
    data.recentPosts = posts
      .reduce((acc, curr) => {
        return [...acc, curr.toObject()];
      }, [])
      .sort(utils.compareObjects)
      .splice(0, 10);

    //this gets all recent emergencies
    data.recentEmergencies = emergencies
      .reduce((acc, curr) => {
        return [...acc, curr.toObject()];
      }, [])
      .sort(utils.compareObjects)
      .splice(0, 10);

    //this gets all recent crimes
    data.recentCrimes = crimes
      .reduce((acc, curr) => {
        return [...acc, curr.toObject()];
      }, [])
      .sort(utils.compareObjects)
      .splice(0, 10);

    // data for the crime chart
    crimes.forEach(crime => {
      data.crimeChart = utils.getCrimesForMonth(crime, data.crimeChart);
    });
    // data for emergency chart
    emergencies.forEach(emergency => {
      data.emergencyChart = utils.getCrimesForMonth(
        emergency,
        data.emergencyChart
      );
    });

    // get crimes for current month
    data.crimeInCurrentMonth = crimes.reduce((acc, curr) => {
      let date = new Date();
      let crimeDate = new Date(curr.time);

      if (
        date.getFullYear() == crimeDate.getFullYear() &&
        date.getMonth() == crimeDate.getMonth()
      ) {
        return acc + 1;
      }
      return acc;
    }, 0);

    // get posts for current month
    data.crimeInPrevMonth = crimes.reduce((acc, curr) => {
      let date = new Date();
      let crimeDate = new Date(curr.time);

      if (
        date.getFullYear() == crimeDate.getFullYear() &&
        date.getMonth() - 1 == crimeDate.getMonth()
      ) {
        return acc + 1;
      }
      return acc;
    }, 0);

    res.status(200).json({
      success: true,
      message: "Dashboard data",
      data
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: {
        statusCode: 500,
        message: err.message
      }
    });
  }
};
