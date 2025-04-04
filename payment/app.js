const express = require("express");
const mongoSanitize = require('express-mongo-sanitize');
const cors = require("cors")

const rechargeRouter = require("./routes/rechargeRoutes")
const accountRouter = require("./routes/accountRoutes")

require("dotenv").config({ path: './.env' });

const { RPCObserver } = require("./rpc/rpc");
RPCObserver(process.env.RPC_QUEUE_NAME);

const app = express();

// app.use(
//     cors({
//         origin: 'https://localhost:3001',
//         credentials: true,
//     })
// );
// app.options("*", cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json())
app.use(cors())
app.use(mongoSanitize());

app.get('/', (req, res) => {
    res.send("Hello")
})

app.use("/recharge", rechargeRouter)
app.use("/account", accountRouter)

module.exports = app;