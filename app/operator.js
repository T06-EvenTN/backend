const express = require("express");
const APIRouter = express.Router();
const User = require("./models/user");
const Event = require("./models/event");
const mongoose = require("mongoose");
const tokenVerifier = require("./middleware/tokenVerifier");
const csv = require("json2csv");

APIRouter.get("/openData", tokenVerifier, async(req, res) => {
    try{
        let events = await Event.find().exec();
        const parser = new csv.Parser();
        const csvData = parser.parse(events);
        res.header('Content-Type', 'text/csv');
        res.attachment('data.csv');
        res.send(csvData);
    } catch(error) {
        console.log(error);
        res.status(500).send({ message: error });
    }
})
module.exports = APIRouter;