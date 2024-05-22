const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: String,
            required: [true, 'A order must belong to a customer'],
            trim: true,
        },

        bookList: [
            {
                book: {
                    type: String,
                    required: [true, 'Book in order must be in the book list']
                },

                quantity: {
                    type: Number,
                    require: [true, 'Book must have quantity.']
                }
            }
        ],

        createdAt: {
            type: Date,
            default: Date.now(),
            select: false
        },

        totalCost: {
            type: Number,
            required: [true, 'A order must have total cost']
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

const Order = new mongoose.model('Order', orderSchema);

module.exports = Order;
