const postSchema = require("../models/post");
const userSchema = require("../models/user");
const DataUri = require("datauri/parser");
const path = require("path");
const cloudinary = require("cloudinary");

//post upload controller
exports.upload = async (req, res, next) => {
  let postTitle = req.body.title;
  let postText = req.body.text || null;

  let phone = req.user.phone_number;
  console.log(req.files);

  try {
    let user = await userSchema.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: err.message,
        error: {
          statusCode: 404,
          description: err.message
        }
      });
    }
    let author = user._id;

    let post = {
      title: postTitle,
      text: postText,
      author: author
    };

    if (req.files) {
      post.media = [];
      let dtauri = new DataUri();
      for (const file of req.files) {
        let dataUri = dtauri.format(
          path.extname(file.originalname),
          file.buffer
        );

        let final_file = dataUri.content;

        let image = await cloudinary.v2.uploader.upload_large(final_file);

        post.media.push({
          url: image.secure_url,
          public_id: image.public_id
        });
      }
    }

    let post_result = await postSchema.create(post);

    return res.status(201).json({
      success: true,
      message: "Post created successfully.",
      data: {
        statusCode: 200,
        post: post_result
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

//post view controller
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

    if (user.role == "user") {
      let posts = await postSchema
        .find()
        .select("-author")
        .sort({ date: -1 })
        .exec();
      return res.status(201).json({
        success: true,
        message: "Success",
        data: {
          statusCode: 200,
          posts: posts
        }
      });
    }

    if (user.role == "super_admin") {
      let posts = await postSchema
        .find()
        .populate("author", "-password")
        .exec();
      return res.status(201).json({
        success: true,
        message: "Success",
        data: {
          /* length: posts.length,
          statusCode: 200, */
          posts: posts.toObject()
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

exports.getAllAdmin = async (req, res, next) => {
  try {
    let { phone_number } = req.user;
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
    if (user.role !== "super_admin") {
      return res.status(401).json({
        success: false,
        message: "You are not authorised to access this resource",
        error: {
          statusCode: 401,
          description: "You are not authorised to access this resource"
        }
      });
    }

    let posts = await postSchema.find().populate("author");
    return res.status(201).json({
      success: true,
      message: "Success",
      data: {
        length: posts.length,
        statusCode: 201,
        posts: posts
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

exports.deletePostByAuthor = async (req, res, next) => {
  let postID = req.params.id;
  try {
    let { phone_number, role } = req.user;
    let user = await userSchema.findOne({
      phone: phone_number
    });

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

    let post = await postSchema
      .findById(postID)
      .populate("author", "phone")
      .exec();

    if (post.author.phone != phone_number) {
      return res.status(401).json({
        success: false,
        message: "You are not authorised to access this resource",
        error: {
          statusCode: 401,
          description: "You are not authorised to access this resource"
        }
      });
    }

    let result = await postSchema.findByIdAndDelete(postID);
    return res.status(200).json({
      success: true,
      message: "Post successfully deleted",
      data: {
        statusCode: 200,
        data: result
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      error: {
        statusCode: err.statusCode,
        description: err.message
      }
    });
  }
};

exports.deletePostByAdmin = async (req, res, next) => {
  let postID = req.params.id;
  try {
    let { phone_number, role } = req.user;

    let user = await userSchema.findOne({
      phone: phone_number
    });

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

    if (user.role != "super_admin") {
      return res.status(401).json({
        success: false,
        message: "You are not authorised to access this resource",
        error: {
          statusCode: 401,
          description: "You are not authorised to access this resource"
        }
      });
    }

    let result = await postSchema.findByIdAndDelete(postID);
    return res.status(200).json({
      success: true,
      message: "Post successfully deleted",
      data: {
        statusCode: 200,
        data: result
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      error: {
        statusCode: err.statusCode,
        description: err.message
      }
    });
  }
};
