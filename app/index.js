//API requirements
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const account = require("./account.js");
const users = require("./users.js");
const events = require("./events.js");
const friends = require("./friends.js");
const eventCode = require("./eventCodes.js");
const operator = require("./operator.js");
const app = express();
const PORT = process.env.PORT;

//middleware definitions
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// mongoose connection
const mongoose = require("mongoose");
const uri = process.env.DATABASE_URL;

const clientOptions = {
    serverApi: { version: "1", strict: true, deprecationErrors: true },
};
mongoose.connect(uri, clientOptions).then(() => {
    console.log("DB connected");
});

//open HTTP connection on PORT
app.listen(PORT, () =>
    console.log(`application started on http://localhost:${PORT}`)
);

//request routing
app.get(`/test`, (req, res) => {
    res.status(200).send("yay!");
});

app.use("/account", account);
app.use("/users", users);
app.use("/events", events);
app.use("/friends", friends);
app.use("/eventCodes", eventCode);
app.use("/oc",operator);

module.exports = app;
