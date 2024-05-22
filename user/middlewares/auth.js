const { promisify } = require("util");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

module.exports = {
    protect: catchAsync(async (req, res, next) => {
        const token = req.cookies.jwt;

        if (!token)
            return next(
                new AppError("You are not logged in! Please log in to get access.", 401)
            );

        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

        const freshUser = await User.findById(decoded.id);
        if (!freshUser)
            return next(
                new AppError(
                    "The user belonging to this token does not longer exist.",
                    401
                )
            );

        if (freshUser.changedPasswordAfter(decoded.iat)) {
            return next(
                new AppError(
                    "User recently changed password! Please log in again.",
                    401
                )
            );
        }

        if (!freshUser.validTokens.includes(token)) {
            return next(
                new AppError(
                    "Token is no longer valid!",
                    401
                )
            );
        }

        req.user = freshUser;
        next();
    }),

    restrictTo: (...roles) => {
        return (req, res, next) => {
            if (!roles.includes(req.user.role)) {
                return next(
                    new AppError(
                        "You do not have permission to perform this action!",
                        403
                    )
                );
            }

            next();
        };
    },
};
