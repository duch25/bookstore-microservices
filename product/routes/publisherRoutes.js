const express = require('express')

const publisherController = require('../controllers/publisherController')

const router = express.Router();

router
    .route("/")
    .get(publisherController.getAllPublishers)
    .post(publisherController.createPublisher);

router
    .route('/:id')
    .get(publisherController.getPublisher)
    .patch(publisherController.updatePublisher)
    .delete(publisherController.deletePublisher);

module.exports = router;