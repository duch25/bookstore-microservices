const express = require("express");

const cartController = require("../controllers/cartController");
const userAuth = require("../middlewares/auth");

const router = express.Router();

router.use(userAuth.protect)

router
    .route("/")
    .get(cartController.showCart)
    .post(cartController.changeCartStatus)
    .patch(cartController.removeBookFromCart)

module.exports = router;