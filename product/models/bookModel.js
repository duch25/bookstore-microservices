const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
    {
        isbn: {
            type: String,
            required: [true, 'A book must have a ISBN'],
            unique: true,
            trim: true
        },

        name: {
            type: String,
            required: [true, 'A book must have a name'],
            trim: true,
        },

        publishedYear: {
            type: Number,
            required: [true, 'A book must have a published year'],
        },

        publisher: {
            type: mongoose.Schema.ObjectId,
            ref: 'Publisher',
            required: [true, 'A book must have a publisher'],
        },

        categories: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'Category',
                required: [true, 'A book must belong to at least one category'],
            }
        ],

        authors: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'Author',
                required: [true, 'A book must belong to at least one author'],
            }
        ],

        purchasePrice: {
            type: Number,
            required: [true, 'A book must have a purchase price'],
        },

        sellPrice: {
            type: Number,
            required: [true, 'A book must have a sell price'],
        },

        sale: {
            type: Number,
            default: 0
        },

        description: {
            type: String,
            trim: true,
        },

        quantity: {
            type: Number,
            required: [true, 'A book must have a quantity']
        },

        coverImage: {
            type: String,
            required: [true, 'A book must have a cover image']
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

bookSchema.pre("save", function (next) {
    this.sellPrice -= this.sellPrice * this.sale * 0.01;
    next();
});

const Book = new mongoose.model('Book', bookSchema);

module.exports = Book;
