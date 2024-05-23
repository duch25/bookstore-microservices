const Order = require('../models/orderModel');
const catchAsync = require("../utils/catchAsync");
const { RPCRequest } = require("../rpc/rpc");

async function getCart(req) {

    //TODO: communicate with Purchase Service
    const requestPayload = {
        method: "GET",
        user: req.user._id,
    }

    const cart = await RPCRequest("PURCHASE_RPC", requestPayload)

    if (!cart) {
        // TODO: communicate with Purchase Service
        requestPayload.method = "POST";
        const newCart = await RPCRequest("PURCHASE_RPC", requestPayload)

        return newCart
    }

    return cart
}

module.exports = {
    // called from client
    checkout: catchAsync(async (req, res, next) => {
        const listISBN = req.body.listISBN;
        let totalCost = req.body.totalCost;

        try {
            const cart = await getCart(req);
            const allBooksInCart = cart.bookList;

            const bookList = [];
            for (const isbn of listISBN) {
                // TODO: communicate with Product Service
                const requestPayload = {
                    method: "GET",
                    isbn: isbn,
                }

                // call Product Service to check stock
                const book = await RPCRequest("PRODUCT_RPC", requestPayload)

                for (const b of allBooksInCart) {
                    if (book.isbn == b.book) {
                        bookList.push(b);
                    }
                }
            }

            const orderPayload = {};
            orderPayload.user = cart.user;
            orderPayload.bookList = bookList;
            orderPayload.totalCost = totalCost;

            const newOrder = await Order.create(orderPayload);

            const purchasedBooks = [];
            for (const isbn of listISBN) {
                for (const book of allBooksInCart) {
                    if (book.book == isbn) {
                        const index = allBooksInCart.indexOf(book);
                        allBooksInCart.splice(index, 1);

                        purchasedBooks.push({ isbn: isbn, quantity: book.quantity });

                        break;
                    }
                }
            }

            // TODO: communicate with Purchase Service to update cart
            const requestUpdateCartPayload = {
                method: "PATCH",
                user: req.user._id,
                data: allBooksInCart
            }

            await RPCRequest("PURCHASE_RPC", requestUpdateCartPayload)

            // TODO: communicate with Payment Service to checkout
            const requestCheckoutPayload = {
                method: "checkout",
                user: req.user._id,
                totalCost: totalCost
            }

            const response = await RPCRequest("PAYMENT_RPC", requestCheckoutPayload)

            if (response.status == "success") {
                newOrder.checkoutStatus = "paid";
                await newOrder.save({ validateBeforeSave: false });

                for (const { isbn, quantity } of purchasedBooks) {

                    // TODO: communicate with Product Service
                    const book = await RPCRequest("PRODUCT_RPC", { method: "GET", isbn: isbn });

                    book.quantity -= quantity;
                    await RPCRequest("PRODUCT_RPC", { method: "PATCH", isbn: isbn, data: book });
                }

                res.status(200).json({
                    status: 'success',
                })
            }
            else {
                res.status(200).json({
                    status: "fail"
                })
            }
        } catch (error) {
            res.status(200).json({
                status: 'fail',
                message: error.message
            })
        }
    }),
}