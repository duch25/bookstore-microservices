const mongoose = require("mongoose");

// handle synchronous error outside our express app
process.on("uncaughtException", err => {
    console.log("Uncaught exception!");
    console.log(err);
    process.exit(1);
})

const app = require("./app");

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

mongoose
    .connect(DB)
    .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3001;
const hostname = process.env.HOST || 'localhost';

const server = app.listen(port, hostname, () => {
    console.log(`User Service running at http://${hostname}:${port}`)
});

// handle asynchronous error outside our express app
process.on("unhandledRejection", err => {
    console.log("Unhandled rejection!");
    console.log(err);
    server.close(() => {
        process.exit(1);
    })
})
