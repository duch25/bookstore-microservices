const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            unique: true,
            required: [true, 'A category must have a name'],
            trim: true,
        },

        slug: {
            type: String,
            // select: false
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

const Category = new mongoose.model('Category', categorySchema);

module.exports = Category;
