const TransactionAccount = require("../models/transactionAccountModel");

function checkTransaction(account, totalCost, today) {
  today = today.getTime();

  const transactionHistory = account.transactionHistory;
  const limit = 200000;
  let totalMoney = 0;

  for (const tran of transactionHistory) {
    if (tran.status == 'completed') {
      const date = new Date(tran.date).getTime();

      if (today == date && tran.amount < 0) {
        totalMoney += -1 * tran.amount;
      }
    }
  }

  return totalMoney + totalCost <= limit;
}

function checkNewCustomer(account) {
  const transactionHistory = account.transactionHistory;

  for (const tran of transactionHistory) {
    if (tran.status == 'completed') {
      if (tran.amount < 0) {
        return false;
      }
    }
  }

  return true;
}

module.exports = {
  payment: async (req, res) => {
    const token = req.body.token;
    let totalCost = req.body.totalCost;

    // TODO: communicate with User Service
    let verifyUser = await fetch('http://localhost:3000/', {
      method: 'POST',
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })

    verifyUser = await verifyUser.json();

    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const date = new Date(`${year}-${month}-${day}`);

    if (verifyUser.status == 'success') {
      const username = verifyUser.user.username;
      const account = await TransactionAccount.findOne({ username: username });
      const isNewCustomer = checkNewCustomer(account);

      if (isNewCustomer) {
        totalCost = totalCost - (totalCost * 5 / 100);
      }

      const isValid = checkTransaction(account, totalCost, date);

      if (account.accountBalance >= totalCost && isValid) {
        account.accountBalance -= totalCost;

        account.transactionHistory.push({
          date: date,
          amount: -totalCost,
          status: "completed"
        })

        await TransactionAccount.findOneAndUpdate({ username: username }, account, {
          new: true,
          runValidators: true
        })

        const admin = await TransactionAccount.findOne({ username: "admin" });
        admin.accountBalance += totalCost;
        admin.transactionHistory.push({
          date: date,
          amount: totalCost,
          status: "completed"
        })

        await TransactionAccount.findOneAndUpdate({ username: "admin" }, admin, {
          new: true,
          runValidators: true
        })

        res.status(200).json({
          status: "success",
          message: ""
        })

      } else {
        account.transactionHistory.push({
          date: date,
          amount: -totalCost,
          status: "failed"
        })

        await TransactionAccount.findOneAndUpdate({ username: username }, account, {
          new: true,
          runValidators: true
        })

        let message = "";
        if (account.accountBalance < totalCost) {
          message = "Not Available Balance";
        } else {
          message = "Over Transaction Limit"
        }

        res.status(200).json({
          status: "fail",
          message: message
        })
      }
    } else {
      res.status(200).json({
        status: "fail",
        message: ""
      })
    }
  },
};
