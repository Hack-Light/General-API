const jwt = require("jsonwebtoken"),
  bCrypt = require("bcrypt"),
  userModel = require("../models/user");

exports.loginUser = async (req, res, next) => {
  const { password, email } = req.body;
  try {
    let user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User does not exist",
        error: {
          statusCode: 404,
          description: "User does not exist"
        }
      });
    } else {
      let result = await bCrypt.compare(password, user.password);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Incorrect password",
          error: {
            statusCode: 404,
            description: "Incorrect password"
          }
        });
      }
      let api_token = jwt.sign(
        {
          phone_number: phone,
          role: user.role
        },
        process.env.JWT_KEY
      );
      user.api_token = api_token;

      user = await user.save();
      return res.status(200).json({
        success: true,
        message: "You're logged in successfully.",
        data: {
          statusCode: 200,
          user
        }
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      error: {
        statusCode: 500,
        description: err.message
      }
    });
  }
};
