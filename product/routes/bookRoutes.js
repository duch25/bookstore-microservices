const express = require('express');
const bookController = require('../controllers/bookController');
const userAuth = require('../middlewares/auth');

const router = express.Router();

const multer = require("multer")
const Storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/assets/images")
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

const upload = multer({ storage: Storage })

router
    .route('/')
    .get(bookController.getAllBooks)
    .post(userAuth.protect, upload.single("file"), bookController.createBook);

router
    .route('/:id')
    .get(bookController.getBook)
    .patch(bookController.updateBook)
    .delete(bookController.deleteBook);

module.exports = router;
