const Book = require('../models/bookModel');
const Author = require('../models/authorModel');

require('../models/authorModel')
require('../models/publisherModel')

const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

module.exports = {
    getAllBooks: catchAsync(async (req, res, next) => {
        const features = new APIFeatures(Book.find().populate([{ path: 'authors' }, { path: 'categories' }, { path: 'publisher' }]), req.query)
            .filter()
            .sort()
            .limitFields()
        // .paginate();

        let books = await features.query;

        if (req.query.name) {
            books = books.filter(book => book.name.toLowerCase().includes(req.query.name.toLowerCase()))
        }

        // Về bản chất thì không cần dòng này, vì sale chỉ thay đổi khi chỉnh sửa, đang ở trong giai đoạn demo nên có thể dùng như này
        books.forEach(book => {
            book.sellPrice *= (1 - 0.01 * book.sale);
        })

        const page = req.query.page * 1 || 1;
        const limit = req.query.limit * 1 || 8;

        const totalPages = Math.ceil(books.length / limit);

        res.status(200).json({
            status: "success",
            data: {
                results: books.length,
                totalPages,
                books: books.splice((page - 1) * limit, limit),
            },
        });
    }),

    getBook: catchAsync(async (req, res, next) => {
        const book = await Book.findOne({ isbn: req.params.id }).populate([{ path: 'authors' }, { path: 'categories' }, { path: 'publisher' }]).lean();

        if (!book) return next(new AppError("No book found with that ID", 404));

        if (!book) {
            res.status(200).json({
                status: "fail",
                data: null,
            })
            return;
        }

        book.discountedPrice = book.sellPrice - (book.sellPrice * book.sale / 100);

        res.status(200).json({
            status: 'success',
            data: {
                book
            }
        });
    }),

    createBook: catchAsync(async (req, res, next) => {
        const { authors: authorName } = req.body;
        const author = await Author.findOne({ name: authorName });
        req.body.authors = [];

        if (!author) {
            const newAuthor = await Author.create({ authorName })
            req.body.authors.push(newAuthor._id);
        }
        else {
            req.body.authors.push(author._id);
        }

        req.body.publishedYear *= 1;
        req.body.quantity *= 1;
        req.body.sellPrice *= 1;
        req.body.purchasePrice *= 1;

        req.body.coverImage = '/assets/images/' + req.file.filename

        const newBook = await Book.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                book: newBook
            }
        });
    }),

    updateBook: catchAsync(async (req, res, next) => {
        const book = await Book.findOneAndUpdate({ isbn: req.params.id }, req.body, {
            new: true,
            runValidators: true
        });

        if (!book) return next(new AppError("No book found with that ID", 404));

        res.status(200).json({
            status: 'success',
            data: {
                book
            }
        });
    }),

    deleteBook: catchAsync(async (req, res, next) => {
        const book = await Book.findOneAndDelete({ isbn: req.params.id });

        if (!book) return next(new AppError("No book found with that ID", 404));

        res.status(200).json({
            status: 'success',
            data: null
        });
    })
}