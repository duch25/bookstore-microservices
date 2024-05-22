const jwt = require("jsonwebtoken");

module.exports = {
    signToken: (id) => {
        return jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });
    },

    createSendToken: async (user, statusCode, res, redirectUrl = '') => {
        const token = signToken(user._id);
        user.validTokens.push(token);
        await user.save({ validateBeforeSave: false });

        const cookieOptions = {
            secure: true,
            expires: new Date(
                //Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
                Date.now() + 10000000
            )
        };
        if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

        res.cookie("jwt", token, cookieOptions);
        user.password = undefined;

        if (redirectUrl !== '') res.redirect(redirectUrl);
        else
            res.status(statusCode).json({
                status: "success",
                data: {
                    user,
                },
            });
    },

    // for payment service
    // verifyUser: async function (req, res) {
    //     const { token } = req.body;

    //     const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    //     const user = await User.findById(decoded.id);

    //     if (user) {
    //         res.status(200).json({
    //             status: "success",
    //             user
    //         })
    //     }
    //     else {
    //         res.status(200).json({
    //             status: "fail"
    //         })
    //     }
    // },
}
