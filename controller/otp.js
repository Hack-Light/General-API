const makeID = require("../util/code_random"),
  UserModel = require("../models/user"),
  OTP = require("../models/otp");

const africastalking = require("africastalking")({
  apiKey: process.env.AFRICASTALKING_API_KEY,
  username: process.env.AFRICASTALKING_USERNAME
});
const codeLength = 6;

exports.send = async (req, res) => {
  try {
    const number = await req.body.phone;
    const user = await UserModel.findOne({ phone: number });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: {
          statusCode: 404,
          error: "User not found"
        }
      });
    }

    let otp = await OTP.findOne({ user_ref_code: user._id });

    if (otp) {
      otp.otp_code = makeID(codeLength, false);
    } else {
      otp = new OTP({
        otp_code: makeID(codeLength, false),
        user_ref_code: user._id
      });
    }

    const otpSaveResult = await otp.save();

    const sms = africastalking.SMS;
    await sms
      .send({
        to: [`+${user.phone}`],
        message: `Your number verification to MyCustomer is ${otpSaveResult.otp_code}`
      })
      .then(response => {
        console.log(user.phone);
        console.log(otp.otp_code);
        console.log(response);
      })
      .catch(error => {
        console.log(error);
      });

    res.status(200).json({
      success: true,
      message: "Message sent successful",
      data: {
        message: "Message sent successful"
      }
    });
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

exports.verify = async (req, res) => {
  try {
    let user = await UserModel.findOne({ phone: req.body.phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: {
          statusCode: 404,
          error: "User not found"
        }
      });
    }

    const otp = await OTP.findOne({ user_ref_code: user._id });

    if (!otp || otp.otp_code != req.body.verify) {
      return res.status(404).json({
        success: false,
        message: "OTP not found",
        data: {
          statusCode: 404,
          error: "OTP not found"
        }
      });
    }

    res.status(200).json({
      success: true,
      message: "otp code verified",
      data: {
        message: "otp code verified",
        user: user
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
      data: {
        statusCode: 500,
        error: err.message
      }
    });
  }
};
