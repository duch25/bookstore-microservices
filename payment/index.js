const mongoose = require("mongoose");

const app = require("./app");

const DB = process.env.DATABASE.replace(
    "<PASSWORD>",
    process.env.DATABASE_PASSWORD
);

const port = process.env.PORT || 3005;
const hostname = process.env.HOST || "localhost";

app.listen(port, hostname, () => {
    console.log(`Payment Service running at https://${hostname}:${port}`);
});

mongoose.connect(DB).then(() => console.log("DB connection successful!"));

