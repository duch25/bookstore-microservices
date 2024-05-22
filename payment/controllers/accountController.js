const transactionAccount = require("../models/transactionAccountModel");

module.exports = {
    createAccount: async function (req, res) {
        const newAccount = await transactionAccount.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                account: newAccount
            }
        });
    },

    getAccount: async function (req, res) {
        const username = req.params.username;

        const account = await transactionAccount.findOne({ username: username });

        if (account) {
            res.status(200).json({
                status: "success",
                data: {
                    account
                }
            })
        }
        else {
            const newAccount = await transactionAccount.create({
                username: username,
                accountBalance: 0,
                transactionHistory: []
            });

            if (newAccount) {
                res.status(200).json({
                    status: "success",
                    data: {
                        account: newAccount
                    }
                })
            }
            else {
                res.status(200).json({
                    status: "fail"
                })
            }
        }
    },

    deleteAccount: async function (req, res) {
        const username = req.params.username;
        await transactionAccount.findOneAndDelete({ username: username });
        res.status(201).json({
            status: 'success',
        });
    },
};
