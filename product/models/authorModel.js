const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A author must have a name'],
            trim: true,
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

const Author = new mongoose.model('Author', authorSchema);

module.exports = Author;
