const express = require('express');
const APIRouter = express.Router();
const User = require('./models/user');
const Event = require('./models/event')
const eventCode = require('./models/eventCode')
const mongoose = require('mongoose');
const tokenVerifier = require('./middleware/tokenVerifier');


//get all codes in eventCodes db
APIRouter.get('/all', async (req, res) => {
    let codes = await eventCode.find().exec();
    if (codes) {
        res.status(200).send(codes);
    } else {
        res.status(500).send({ message: 'no codes found' });
    }
})

//check if an eventcode is valid
APIRouter.post('/validate-code', tokenVerifier, async (req, res) => {
    try {
        const codeChecked = req.body.code;
        const codeEntry = await eventCode.findOne({ code: codeChecked, isValid: true });
        if (codeEntry) {
            res.status(200).json({ message: 'Code is valid!' });
        } else {
            res.status(400).json({ message: 'Invalid or expired code.' });
        }
    } catch (error) {
        res.status(500).send({ message: "internal error" });
    }
});

//create a new eventcode
APIRouter.post('/create-code', tokenVerifier, async (req, res) => {
    try {
        const nuovoCodice = Math.random().toString(36).slice(2)
        const existingCode = await eventCode.findOne({ code: nuovoCodice });
        while(!existingCode) {
            nuovoCodice = Math.random().toString(36).slice(2)
            existingCode = await eventCode.findOne({ code: nuovoCodice });
        }
        
        let nuovo = new eventCode({
            "code": nuovoCodice,
        });

        
        console.log("Creating new eventCode document");

        nuovo = await nuovo.save();
        let codeID = nuovo.id;
        res.status(201).send(`Created code ${codeID} with code ${nuovoCodice}`);

    } catch (error) { 
        console.error("Error occurred:", error);  
        res.status(500).send({ message: "Internal server error", error: error.message });
    }
});

//makes it so that the code is no longer available
APIRouter.post('/invalidate-code', tokenVerifier, async (req, res) => {
    try {
        console.log(req.body.code);
        const codice = req.body.code;
        const event = req.body.eventId;
        if(codice !== null){
            if (event !== null){
                await eventCode.findOneAndUpdate({code: codice},{isValid: false, eventID: event});
                return res.status(200).send({message: `code ${codice} has been associated to event ${event}`});
            } else return res.status(404).send({message: "could not find event"});
        } else return res.status(404).send({message: "could not find event code"});
    } catch (error) {
        console.error("Error occurred:", error);  
        res.status(500).send({ message: "Internal server error", error: error.message });
    }
})

module.exports = APIRouter;