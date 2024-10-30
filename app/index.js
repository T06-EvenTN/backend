//API requirements
const express = require('express');

const users = require('./users.js');

const app = express();
const PORT = process.env.PORT;

//middleware definitions
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// mongoose connection
const mongoose = require('mongoose');
const uri = process.env.DATABASE_URL;

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };
mongoose.connect(uri, clientOptions);

//open HTTP connection on PORT
app.listen(
  PORT,
  () => console.log(`application started on http://localhost:${PORT}`)
);

//request routing
app.get(`/test`, (req,res) => {
  res.status(200).send("yay!");
})

app.use('/users', users);

module.exports = app;