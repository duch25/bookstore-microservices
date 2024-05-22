const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: {
        type: String,
        required: [true, 'Cart must belong to a customer'],
    },

    bookList: [
        {
            book: {
                type: String,
                required: [true, 'Book in cart must be in the book list'],
            },
            quantity: {
                type: Number,
                require: [true, 'Book must have quantity.']
            }
        }
    ],
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
