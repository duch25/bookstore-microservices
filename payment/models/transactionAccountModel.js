const mongoose = require('mongoose');

const transactionAccountModel = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'An author must have a username'],
      trim: true,
    },

    accountBalance: {
      type: Number,
      required: [true, 'An author must have an account balance'],
    },

    transactionHistory: [
      {
        date: {
          type: Date,
          required: true,
        },

        amount: {
          type: Number,
          required: true,
        },

        status: {
          type: String,
          enum: ['completed', 'failed'],
          default: 'failed',
        },
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const TransactionAccount = mongoose.model('transactionAccount', transactionAccountModel);

module.exports = TransactionAccount;