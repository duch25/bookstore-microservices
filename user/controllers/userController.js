const { promisify } = require("util");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");

const { RPCRequest } = require("../rpc/rpc");

const { createSendToken } = require("../utils/tokensAndCookies");
const { sendEmail } = require("../utils/email");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

module.exports = {
  getProfile: catchAsync(async (req, res, next) => {
    const token = req.cookies.jwt;
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return next(new AppError("No user found with that ID", 404));

    // TODO: communicate with Payment Service to get account balance
    const requestPayload = {
      method: "inquire",
      username: user.username,
    }

    const data = await RPCRequest("PAYMENT_RPC", requestPayload)

    res.status(200).json({
      status: "success",
      data: {
        user: { ...user._doc, accountBalance: data.accountBalance }
      }
    })
  }),

  // update myself
  updateMe: catchAsync(async (req, res, next) => {
    if (req.file)
      req.body.avatar = req.file.filename
    if (req.body.password || req.body.passwordCurrent)
      return next(new AppError("This route is not for password updates!", 400));

    const filteredBody = filterObj(req.body, "name", "username", "avatar");

    const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        user: updateUser,
      },
    });
  }),

  signup: catchAsync(async (req, res, next) => {
    const { username } = req.body;
    const existUser = await User.findOne({ username });
    if (!existUser) {
      const newUser = await User.create(req.body);
      const requestPayload = {
        method: "POST",
        user: newUser._id,
      }

      //TODO: communicate with Purchase Service
      await RPCRequest("PURCHASE_RPC", requestPayload)

      createSendToken(newUser, 201, res);
    } else {
      console.log("Existed!!!");
      res.status(200).json({
        status: "fail"
      })
    }
  }),

  login: catchAsync(async (req, res, next) => {
    const { username, password } = req.body;
    console.log(username, password);

    if (!username || !password) {
      res.status(400).json({
        status: "fail",
        message: "Please provide email and password!"
      })
    } else {
      const user = await User.findOne({ username }).select("+password");
      if (!user) {
        res.status(400).json({
          status: "fail",
          message: "Username doesn't exist"
        })
      } else if (!user || !(await user.correctPassword(password, user.password))) {
        res.status(400).json({
          status: "fail",
          message: "Incorrect username or password"
        })
      } else {
        res.user = user;
        createSendToken(user, 200, res);
      }
    }
  }),

  loginWithGoogle: catchAsync(async (req, res, next) => {
    const redirectUrl = req.query.state;
    const { name, email, picture } = req.user._json;

    const body = {
      name,
      username: email,
      avatar: picture,
      provider: "google",
    };

    let user = await User.findOne({ username: email });
    if (user)
      user.set(body);
    else
      user = new User(body);

    await user.save({ validateBeforeSave: false });

    createSendToken(user, 200, res, redirectUrl);
  }),


  logout: catchAsync(async (req, res, next) => {
    const token = req.cookies.jwt;
    req.user.validTokens = req.user.validTokens.filter(e => e !== token)
    await req.user.save({ validateBeforeSave: false });

    res.clearCookie('jwt');
    res.redirect("/")
  }),

  // if username is email
  forgotPassword: catchAsync(async (req, res, next) => {
    const user = await User.findOne({ username: req.body.username });
    if (!user)
      return next(new AppError("There is no user with username.", 404));

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
      await sendEmail({
        email: user.username,
        subject: "Your password reset token (valid for 10 min)",
        message,
      });

      res.status(200).json({
        status: "success",
        message: "Token sent to email!",
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new AppError(
          "There was an error sending the email. Try again later!",
          500
        )
      );
    }
  }),

  resetPassword: catchAsync(async (req, res, next) => {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) return next(new AppError("Token is invalid or expired!", 400));

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);
  }),

  updatePassword: catchAsync(async (req, res, next) => {

    const user = await User.findById(req.user.id).select("+password");

    if (!user) return next(new AppError("Invalid user!", 400));

    if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
      return next(new AppError("Your current password is wrong!", 401));

    user.password = req.body.password;
    await user.save();

    createSendToken(user, 200, res);
  }),
};
