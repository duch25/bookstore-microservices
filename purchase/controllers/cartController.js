const Cart = require('../models/cartModel');

async function getCart(req) {
    const user = req.user;
    const userID = user._id;
    const cart = await Cart.findOne({ user: userID });
    if (!cart) {
        const data = {
            user: userID,
            bookList: []
        }
        const newCart = await Cart.create(data);
        return newCart;
    } else {
        return cart;
    }
}

module.exports = {
    showCart: async function (req, res) {
        try {
            const cart = await getCart(req);
            const bookList = cart.bookList;

            const booksInCart = [];
            let totalCost = 0;
            let totalDiscount = 0;
            for (const book of bookList) {

                // TODO: communicate with Product Service
                let objBook = await Book.findById(book.bosok).lean();

                if (objBook) {
                    objBook.inCart = Math.min(book.quantity, objBook.quantity);
                    objBook.discount = objBook.sale * objBook.cost / 100
                    objBook.discountedPrice = objBook.sellPrice - (objBook.sellPrice * objBook.sale / 100);
                    objBook.cost = objBook.inCart * objBook.discountedPrice;

                    totalCost += objBook.cost;
                    totalDiscount += objBook.discount;

                    objBook.name = objBook.name.length < 50 ? objBook.name : objBook.name.substr(0, 50).concat('...');

                    booksInCart.push(objBook);
                }
            }
            const lastestCart = await Cart.findByIdAndUpdate(cart._id, { bookList: bookList }, {
                new: true,
                runValidators: true
            });
            res.render('cart', {
                books: booksInCart,
                totalCost: totalCost,
                totalDiscount: totalDiscount,
                checkoutPrice: totalCost - totalDiscount
            });
        } catch (error) {
            res.status(400).json({
                status: 'fail',
                message: error.message
            })
            console.log(error);
        }
    },

    changeCartStatus: async function (req, res) {
        const method = req.body.method;
        const isbn = req.body.isbn;
        const quantity = req.body.quantity;
        try {
            const cart = await getCart(req);
            const bookList = cart.bookList;

            // TODO: communicate with Product Service
            let book = await Book.findOne({ isbn: isbn });

            const bookID = String(book._id);
            let curBook = null;
            for (const book of bookList) {
                if (String(book.book) == bookID) {
                    curBook = book;
                }
            }
            if (curBook) {
                curBook.quantity = Math.min(curBook.quantity, book.quantity);
            }
            if (method === 'increase') {
                if (curBook == null) {
                    cart.bookList.push({ book: book._id, quantity: quantity });
                    const lastestCart = await Cart.findByIdAndUpdate(cart._id, { bookList: bookList }, {
                        new: true,
                        runValidators: true
                    });
                    res.status(200).json({
                        status: 'success',
                        data: {
                            quantity: 1,
                            cost: book.sellPrice,
                            numBook: bookList.length
                        }
                    });
                } else {

                    const maxQuantity = book.quantity;

                    if (curBook.quantity + quantity <= maxQuantity) {
                        curBook.quantity += quantity
                        const lastestCart = await Cart.findByIdAndUpdate(cart._id, { bookList: bookList }, {
                            new: true,
                            runValidators: true
                        });
                        res.status(200).json({
                            status: 'success',
                            data: {
                                quantity: curBook.quantity,
                                cost: curBook.quantity * (book.sellPrice - book.sellPrice * book.sale / 100),
                                numBook: bookList.length
                            }
                        });
                    } else {
                        res.status(400).json({
                            status: 'fail',
                        });
                    }
                }

            } else if (method === 'decrease') {
                if (curBook.quantity == 1) {
                    res.status(400).json({
                        status: 'fail',
                    });
                } else {
                    curBook.quantity -= 1
                    const lastestCart = await Cart.findByIdAndUpdate(cart._id, { bookList: bookList }, {
                        new: true,
                        runValidators: true
                    });
                    res.status(200).json({
                        status: 'success',
                        data: {
                            quantity: curBook.quantity,
                            cost: curBook.quantity * (book.sellPrice - book.sellPrice * book.sale / 100),
                            discount: (curBook.quantity * book.sellPrice * book.sale) / 100
                        }
                    })
                }
            }
        } catch (error) {
            res.status(400).json({
                status: 'fail',
                message: error.message
            })
            console.log(error);
        }
    },
    removeBookFromCart: async function (req, res) {
        const isbn = req.body.isbn;

        try {
            const cart = await getCart(req);
            const bookList = cart.bookList;

            // TODO: communicate with Product Service
            let book = await Book.findOne({ isbn: isbn });

            const bookID = String(book._id);
            let cost = 0;
            for (let i = 0; i < bookList.length; i++) {
                if (String(bookList[i].book) == bookID) {
                    cost = bookList[i].quantity * book.sellPrice;
                    discount = cost * book.sale / 100;
                    bookList.splice(i, 1);
                }
            }
            const lastestCart = await Cart.findByIdAndUpdate(cart._id, { bookList: bookList }, {
                new: true,
                runValidators: true
            });
            res.status(200).json({
                status: 'success',
                data: {
                    cost,
                    discount
                }
            })
        } catch (error) {
            res.status(400).json({
                status: 'fail',
                message: error.message
            })
            console.log(error);
        }

    }
}