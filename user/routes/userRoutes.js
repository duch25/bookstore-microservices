const express = require('express')
const multer = require("multer")
const passport = require('passport')

const userController = require('../controllers/userController')
const userAuth = require("../middlewares/auth");

const Storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/assets/images")
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
const upload = multer({ storage: Storage })

const router = express.Router();

router.post('/signup', userController.signup)
router.post('/login', userController.login)

router.post('/forgotPassword', userController.forgotPassword)
router.patch('/resetPassword/:token', userController.resetPassword)

router.get("/auth/google", (req, res) => {
    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false,
        state: req.query.redirect,
    })(req, res);
});

router.get(
    "/auth/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: '/',
        failureFlash: "Invalid Google credentials.",
    }),
    authController.loginWithGoogle
);

router.use(userAuth.protect)

router.get("/logout", userController.logout)
router.patch('/updatePassword', userController.updatePassword)
router.patch('/updateMe', upload.single('file'), userController.updateMe)

router
    .route('/:id')
    .get(userController.getProfile)

module.exports = router;