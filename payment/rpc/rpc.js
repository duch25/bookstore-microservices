const amqplib = require('amqplib');
const { v4: uuid4 } = require('uuid');

const TransactionAccount = require("../models/transactionAccountModel");

let amqplibConnection = null;

const getChannel = async () => {
    if (amqplibConnection === null) {
        amqplibConnection = await amqplib.connect(process.env.MSG_QUEUE_URL)
    }

    return await amqplibConnection.createChannel();
}

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

const databaseOperation = async (requestPayload) => {
    const method = requestPayload.method;

    let res = null;

    if (method === 'inquire') {
        res = await TransactionAccount.findOne({ username: requestPayload.username });
    }
    else if (method === "checkout") {
        const user = requestPayload.user;
        let totalCost = requestPayload.totalCost;

        // TODO: communicate with User Service to verify user
        const freshUser = await RPCRequest("USER_RPC", { method: "GET", userId: user });

        const currentDate = new Date();
        const day = currentDate.getDate();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const date = new Date(`${year}-${month}-${day}`);

        if (freshUser) {
            const username = freshUser.username;
            const account = await TransactionAccount.findOne({ username: username });

            // discount for new customer
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

                res = { status: "success" }

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

                res = { status: "fail", message: message }
            }
        } else {
            res = { status: "fail" }
        }
    }

    return res;
}

const RPCObserver = async (RPC_QUEUE_NAME) => {
    const channel = await getChannel();

    await channel.assertQueue(RPC_QUEUE_NAME, {
        durable: false,
    });

    channel.prefetch(1);

    channel.consume(
        RPC_QUEUE_NAME,
        async (msg) => {
            if (msg.content) {
                const payload = JSON.parse(msg.content.toString());

                const response = await databaseOperation(payload);

                channel.sendToQueue(msg.properties.replyTo,
                    Buffer.from(JSON.stringify(response)),
                    {
                        correlationId: msg.properties.correlationId,
                    }
                );
            }
        },
        {
            noAck: true,
        }
    );
}

const requestData = async (RPC_QUEUE_NAME, payload, uuid) => {
    const channel = await getChannel();

    const q = await channel.assertQueue("", { exclusive: true });

    channel.sendToQueue(RPC_QUEUE_NAME, Buffer.from(JSON.stringify(payload)), {
        replyTo: q.queue,
        correlationId: uuid
    })

    return new Promise((resolve, reject) => {
        channel.consume(
            q.queue,
            (msg) => {
                if (msg.properties.correlationId === uuid) {
                    resolve(JSON.parse(msg.content.toString()));
                } else {
                    reject(undefined);
                }
            },
            {
                noAck: true,
            }
        )
    })
}

const RPCRequest = async (RPC_QUEUE_NAME, payload) => {
    const uuid = uuid4();

    return await requestData(RPC_QUEUE_NAME, payload, uuid);
}

module.exports = {
    getChannel,
    RPCObserver,
    RPCRequest
}