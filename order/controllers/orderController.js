const Order = require('../models/orderModel');
const catchAsync = require("../utils/catchAsync");

async function getCart(req) {
    const user = req.user;
    const userID = user._id;

    // TODO: communicate with Purchase Service
    const cart = await Cart.findOne({ user: userID });

    if (!cart) {
        const data = {
            user: userID,
            bookList: []
        }

        // TODO: communicate with Purchase Service
        const newCart = await Cart.create(data);

        return newCart
    }

    return cart
}

module.exports = {
    checkout: catchAsync(async (req, res, next) => {
        const listISBN = req.body.listISBN;
        let totalCost = req.body.totalCost;

        try {
            const cart = await getCart(req);
            const allBooksInCart = cart.bookList;

            const bookList = [];
            for (const isbn of listISBN) {
                // TODO: communicate with Product Service
                const book = await Book.findOne({ isbn: isbn }).lean();

                for (const b of allBooksInCart) {
                    if (book._id.toString() == b.book.toString()) {
                        bookList.push(b);
                    }
                }
            }

            const newOrder = {};
            newOrder.user = cart.user;
            newOrder.bookList = bookList;
            newOrder.totalCost = totalCost;

            await Order.create(newOrder);

            for (const isbn of listISBN) {
                // TODO: communicate with Product Service
                const book = await Book.findOne({ isbn: isbn });

                for (const b of allBooksInCart) {
                    if (book._id.toString() == b.book.toString()) {
                        book.quantity -= b.quantity;
                    }
                }

                // TODO: communicate with Product Service
                await Book.findByIdAndUpdate(book._id, book, {
                    new: true,
                    runValidators: true
                });
            }

            res.status(200).json({
                status: 'success',
            })

        } catch (error) {
            res.status(200).json({
                status: 'fail',
                message: error.message
            })

            console.log(error);
        }
    }),
}