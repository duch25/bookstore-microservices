const express = require('express')

const rechargeController = require('../controllers/rechargeController');

const router = express.Router();

router
    .route('/')
    .post(rechargeController.recharge)

module.exports = router;