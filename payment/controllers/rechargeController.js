const transactionAccount = require("../models/transactionAccountModel");

function checkTransaction(account, cost, today) {
  today = today.getTime();

  const transactionHistory = account.transactionHistory;
  const limit = 500000;
  let totalMoney = 0;

  for (const tran of transactionHistory) {
    if (tran.status == "completed") {
      const date = new Date(tran.date).getTime();

      if (today == date && tran.amount > 0) {
        totalMoney += tran.amount;
      }
    }
  }

  return parseInt(totalMoney) + parseInt(cost) <= limit;
}

module.exports = {
  recharge: async function (req, res) {
    const { token, value, date } = req.body;

    // TODO: communicate with User Service
    const response = await fetch("http://localhost:3000", {
      method: "POST",
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },

      body: JSON.stringify({ token: token }),
    });

    const data = await response.json();

    const { username } = data.user;

    const currentDate = new Date(date);

    const account = await transactionAccount.findOne({ username: username });
    const isValid = checkTransaction(account, value, currentDate);
    let updatedAccount;

    if (data.status == "success") {
      let status = "failed"

      if (isValid) {
        status = "completed"

        updatedAccount = await transactionAccount.findOneAndUpdate(
          { username: username },
          {
            $inc: { accountBalance: value },
            $push: {
              transactionHistory: {
                date: date,
                amount: value,
                status: status,
              },
            },
          },
          { new: true }
        );

        res.status(200).json({
          status: "success",
          updatedAccount,
        });
      }
      else {
        updatedAccount = await transactionAccount.findOneAndUpdate(
          { username: username },
          {
            $push: {
              transactionHistory: {
                date: date,
                amount: value,
                status: status,
              },
            },
          },
          { new: true }
        );

        res.status(200).json({
          status: "fail",
        });
      }

    } else {
      res.status(200).json({
        status: "fail",
      });
    }
  },
};
