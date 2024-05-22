const express = require(`express`);

const orderController = require("../controllers/orderController");
const userAuth = require("../middlewares/auth");

const router = express.Router();

router.use(userAuth.protect)

router
    .route("/")
    .post(userAuth.protect, orderController.checkout)

module.exports = router;