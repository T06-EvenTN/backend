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

module.exports = APIRouter;