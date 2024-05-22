const express = require('express')

const payController = require('../controllers/paymentController');

const router = express.Router();

router
    .route('/')
    .post(payController.payment)

module.exports = router;