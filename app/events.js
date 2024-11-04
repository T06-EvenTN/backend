const express = require('express');
const APIRouter = express.Router();
const Event = require('./models/event');

APIRouter.get('', async (req,res) => {
  let events = await Event.find().exec();
  if(events && events.length>0){
    res.status(200).send(events);
  } else {
    res.status(404).send({message: "no events found"});
  }
})

APIRouter.post('', async (req,res) => {
  try{
  let event = new Event({
    "eventName": req.body.eventName,
    "eventStart": req.body.eventStart,
    "eventLength": req.body.eventLength,
    "eventDescription": req.body.eventDescription,
    eventPosition: [req.body.xcoord,req.body.ycoord],
  });
  event = await event.save();
  let eventid = event.id;
  res.status(201).send(`created event ${eventid}`);
  //TODO: handle incorrect requests (400) and server errors 
} catch(error) {
  res.status(500).send({message: "internal error."});
}
  });


module.exports = APIRouter;