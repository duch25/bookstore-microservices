const express = require('express')

const accountController = require('../controllers/accountController');

const router = express.Router();

router
    .route('/')
    .post(accountController.createAccount)

router
    .route('/:username')
    .get(accountController.getAccount)
    .delete(accountController.deleteAccount)

module.exports = router;