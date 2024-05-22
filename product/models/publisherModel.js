const mongoose = require('mongoose');

const publisherSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            unique: true,
            required: [true, 'A publisher must have a name'],
            trim: true,
        },

        address: {
            type: String,
            required: [true, 'A publisher must have a address'],
            trim: true,
        },

        phone: {
            type: String,
            required: [true, 'A publisher must have a phone number']
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

const Publisher = new mongoose.model('Publisher', publisherSchema);

module.exports = Publisher;
