const express = require('express');
const APIRouter = express.Router();
const Event = require('./models/event');
const mongoose = require('mongoose');

APIRouter.get('', async (req,res) => {
try{
let events = await Event.find().exec();
if(events && events.length>0){
res.status(200).send(events);
} else res.status(404).send({message: "no events found"});
} catch (error){
res.status(500).send({message: error});
}
});

APIRouter.post('', async (req,res) => {
try{
if (!req.body.eventName || !req.body.eventStart || !req.body.eventLength || !req.body.eventDescription) {
//await event.delete(); //decidere se metterlo o no
return res.status(400).send({ message: 'Missing or invalid parameters.' });
}
if (typeof req.body.xcoord !== 'number' || typeof req.body.ycoord !== 'number') {
return res.status(400).send({ message: 'coordinates must be numbers.' });
}
if (isNaN(Date.parse(req.body.eventStart))) {
return res.status(400).send({ message: 'invalid event start date.' });
}
let event = new Event({
"eventName": req.body.eventName,
"eventStart": req.body.eventStart,
"eventLength": req.body.eventLength,
"eventDescription": req.body.eventDescription,
eventPosition: [req.body.xcoord,req.body.ycoord],
});
event = await event.save();
let eventid = event.id;
//TODO: handle incorrect requests (400) and unauth (403)

return res.status(201).send(`created event ${eventid}`);

} catch(error) {
res.status(500).send({message: "internal error."});
}
});

APIRouter.get('/:id', async (req,res) => {
try{
const{ id } = req.params;
if(mongoose.isValidObjectId(id)){
let event = await Event.findById(id);
if(event){
res.status(200).send(event);
} else {
res.status(404).send({message: "no events found"});
}
} else res.status(400).send({message: "invalid ID"});
} catch(error){
res.status(500).send({message: "internal error"});
}
});

APIRouter.put('/:id', async (req,res) => {
try{
const { id } = req.params;
if(mongoose.isValidObjectId(id)){
const validReq = await Event.findById(id);
if(validReq){
const newEventName = req.body.eventName ?? validReq.eventName;
const newEventStart = req.body.eventStart ?? validReq.eventStart;
const newEventLength = req.body.eventLength ?? validReq.eventLength;
const newEventDescription = req.body.eventDescription ?? validReq.eventDescription;
let newEventPosition = [];
if(!req.body.xcoord || !req.body.ycoord){
newEventPosition = validReq.eventPosition;
} else newEventPosition = [req.body.xcoord,req.body.ycoord];
await Event.findByIdAndUpdate(id, {
"eventName": newEventName,
"eventStart": newEventStart,
"eventLength": newEventLength,
"eventDescription": newEventDescription,
eventPosition: newEventPosition
});
res.status(200).send(`updated event ${id}`);
} else res.status(404).send({message: "event not found"});
} else res.status(400).send({message: "invalid ID"});
} catch (error) {
res.status(500).send({message: `internal error: ${error}`});
}
})



module.exports = APIRouter;