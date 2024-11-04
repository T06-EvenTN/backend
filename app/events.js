const express = require('express');
const APIRouter = express.Router();
const Event = require('./models/event');
const mongoose = require('mongoose');

APIRouter.get('', async (req,res) => {
  let events = await Event.find().exec();
  if(events && events.length>0){
    res.status(200).send(events);
  } else {
    res.status(404).send({message: "no events found"});
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