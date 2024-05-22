const express = require("express");
const rateLimit = require("express-rate-limit");
// const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean')
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const orderRouter = require('./routes/orderRoutes');

require("dotenv").config({ path: './.env' });

const app = express();

app.use(cookieParser());

app.use(
    cors({
        origin: '/',
        credentials: true,
    })
);
app.options("*", cors());

// security http header
// app.use(helmet());

// limit requests from same IP
const limiter = rateLimit({
    // for test
    max: 100000,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour.',
})
app.use(cors())
app.use('/', limiter);
app.use(express.json());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp({
    whitelist: [''],
}));

app.use(express.urlencoded({ extended: false }));
app.use(compression());

app.use('/orders', orderRouter);

// bad request
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`), 404);
})

// hanlde error inside out express app
app.use(globalErrorHandler)
module.exports = app;
