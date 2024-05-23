const amqplib = require('amqplib');
const { v4: uuid4 } = require('uuid');

const Cart = require("../models/cartModel");

let amqplibConnection = null;

const getChannel = async () => {
    if (amqplibConnection === null) {
        amqplibConnection = await amqplib.connect(process.env.MSG_QUEUE_URL)
    }

    return await amqplibConnection.createChannel();
}

const databaseOperation = async (requestPayload) => {
    const method = requestPayload.method;

    let res = null;

    if (method === 'GET') {
        res = await Cart.findOne({ user: requestPayload.user });
    }
    else if (method === 'POST') {
        res = await Cart.create({ user: requestPayload.user, bookList: [] });
    }
    else if (method === "PATCH") {
        res = await Cart.findOneAndUpdate({ user: requestPayload.user }, { bookList: requestPayload.data }, {
            new: true,
            runValidators: true,
        })
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