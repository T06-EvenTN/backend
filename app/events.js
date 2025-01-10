const express = require("express");
const APIRouter = express.Router();
const Event = require("./models/event");
const User = require("./models/user");
const mongoose = require("mongoose");
const tokenVerifier = require("./middleware/tokenVerifier");
const upload = require('./middleware/upload');
const cloudinary = require('./middleware/cloudinaryConfig');

const eventTags = ['Musica', 'Festival', 'Sport', 'Conferenza', 'Sagra'];

// returns all events
APIRouter.get('/all', async (req, res) => {
  try {
    let events = await Event.find().exec();
    if (events && events.length > 0) {
      res.status(200).send(events);
    } else res.status(404).send({ message: "no events found" });
  } catch (error) {
    res.status(500).send({ message: error });
  }
});

// creates a new event, if previously logged in and able to do so
APIRouter.post("", tokenVerifier, async (req, res) => {
  try {
    if (
      !req.body.eventName ||
      !req.body.eventStart ||
      !req.body.eventLength ||
      !req.body.eventDescription ||
      !req.body.eventTag
    ) {
      return res
        .status(400)
        .send({ message: "Missing or invalid parameters." });
    }
    if (
        typeof req.body.xcoord !== "number" ||
        typeof req.body.ycoord !== "number"
    ) {
      return res.status(400).send({ message: "coordinates must be numbers." });
    }
    if (isNaN(Date.parse(req.body.eventStart))) {
      return res.status(400).send({ message: "invalid event start date." });
    }
    const eventStartDate = new Date(req.body.eventStart); // convert to date
    const eventEndDate = new Date(req.body.eventLength);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // remove hours, then compare
    if (eventStartDate < today) {
      return res.status(400).send({ message: "event start date cannot be in the past." });
    }
    if (eventEndDate < eventStartDate) {
      return res.status(400).send({ message: "event start date cannot be before event end date." });
    }
    if (!eventTags.includes(req.body.eventTag)) {
      return res.status(400).send({
        message: `invalid tag. Must be one of: ${eventTags.join(', ')}.`
      });
    }
    let event = new Event({
      eventName: req.body.eventName,
      eventImage: req.body.eventImage,
      eventStart: req.body.eventStart,
      eventLength: req.body.eventLength,
      eventDescription: req.body.eventDescription,
      eventPosition: [req.body.xcoord, req.body.ycoord],
      eventPresence: 0,
      eventTag: req.body.eventTag,
      eventCreatedBy: req.user._id
    });
    event = await event.save();

    let eventid = event.id;
    return res.status(201).send(`created event ${eventid}`);
  } catch (error) {
    res.status(500).send({ message: "internal error." });
  }
});

APIRouter.post("/image", tokenVerifier, upload.single('eventImage'), async(req, res) => {
    const eventId = req.body.eventId;
    //arrow function to make code more readable
    const eventMatchesCreator = (event) => event.eventCreatedBy == req.user._id;

    if(req.file){
        //verifies supplied event actually exists
        let event = await Event.findById(eventId);
        if(event){
            if(eventMatchesCreator(event)){
                //uploads image to the remote image hosting service
                const result = await cloudinary.uploader.upload(req.file.path, function(err,result){
                    if(err){
                        //cludinary internal handler
                        console.log(`upload error for event ${eventId}`);
                        console.log(err);
                        res.status(500).send({message: err})
                    } 
                });
                //new remote URL for the image
                const remoteUrl = result.secure_url;
                //put new URL in the eventImage field of the event in the database
                await Event.findByIdAndUpdate(eventId, {eventImage: remoteUrl});
                res.status(200).send({message: "image uploaded succesfully", path: remoteUrl});

            } else res.status(403).send({message: "user is not the event creator"});
        } else res.status(404).send({message: "supplied eventId has no corresponding event"})
    } else res.status(400).send({message: "no files uploaded"});
    
})

// returns one event
APIRouter.get("/info/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.isValidObjectId(id)) {
      let event = await Event.findById(id);
      if (event) {
        res.status(200).send(event);
      } else {
        res.status(404).send({ message: "no events found" });
      }
    } else res.status(400).send({ message: "invalid ID" });
  } catch (error) {
    res.status(500).send({ message: "internal error" });
  }
});

// modifies event information, only event creator can do so
APIRouter.put("/:id", tokenVerifier, async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.isValidObjectId(id)) {
      const validReq = await Event.findById(id);
      if (validReq) {
        if(!(req.user._id == validReq.eventCreatedBy)) {
          return res.status(400).send({ message: "User is not the same that created the event." });
        }
        if (
          req.body.eventName !== undefined &&
          (typeof req.body.eventName !== "string")
        ) {
          return res.status(400).send({ message: "Name must be a string." });
        }
        if (
          req.body.eventDescription !== undefined &&
          (typeof req.body.eventDescription !== "string")
        ) {
          return res.status(400).send({ message: "Description must be a string." });
        }
        if (
          req.body.xcoord !== undefined && req.body.ycoord !== undefined &&
          (typeof req.body.xcoord !== "number" || typeof req.body.ycoord !== "number")
        ) {
          return res.status(400).send({ message: "Coordinates must be numbers." });
        }

        // Check if event start date is valid (only if provided)
        if (req.body.eventStart && isNaN(Date.parse(req.body.eventStart))) {
          return res.status(400).send({ message: "Invalid event start date." });
        }

        // Check if eventTag is valid (only if provided)
        if (req.body.eventTag && !eventTags.includes(req.body.eventTag)) {
          return res.status(400).send({
            message: `Invalid tag. Must be one of: ${eventTags.join(', ')}.`
          });
        }
        const newEventName = req.body.eventName ?? validReq.eventName;
        const newEventStart = req.body.eventStart ?? validReq.eventStart;
        const newEventLength = req.body.eventLength ?? validReq.eventLength;
        const newEventDescription =
          req.body.eventDescription ?? validReq.eventDescription;

        let newEventPosition = validReq.eventPosition; 
        if (req.body.xcoord !== undefined || req.body.ycoord !== undefined) {
          newEventPosition = [
            req.body.xcoord !== undefined ? req.body.xcoord : validReq.eventPosition[0],
            req.body.ycoord !== undefined ? req.body.ycoord : validReq.eventPosition[1] 
          ];
        }

        const newEventTag = req.body.eventTag ?? validReq.eventTag;
        await Event.findByIdAndUpdate(id, {
          eventName: newEventName,
          eventStart: newEventStart,
          eventLength: newEventLength,
          eventDescription: newEventDescription,
          eventPosition: newEventPosition,
          eventTag: newEventTag,
        });
        res.status(200).send(`updated event ${id}`);
      } else res.status(404).send({ message: "event not found" });
    } else res.status(400).send({ message: "invalid ID" });
  } catch (error) {
    res.status(500).send({ message: `internal error: ${error}` });
  }
});

// presence counter gets increased by one
APIRouter.patch("/counter/:id", tokenVerifier, async (req,res) =>{
  try {
    const { id } = req.params;
    if(!id){
      return res.status(400).send({message: "Event ID is not present."})
    }
    if (mongoose.isValidObjectId(id)&&mongoose.isValidObjectId(req.user._id)) {
      let user = await User.findOne({_id:req.user._id});
      if (!user) {
        return res.status(404).send({ message: "User not found." });
      }
      const validReq = await Event.findById(id);
      if (validReq) {
        if(!user.events.includes(id)){
          await Event.findByIdAndUpdate(id, {
            eventPresence: validReq.eventPresence+1
          });
          res.status(200).send(`updated event ${id}`);
        } else res.status(400).send({message: "the event has already been added to the list"})
      } else res.status(404).send({ message: "event not found" });
    } else res.status(400).send({ message: "user ID or event ID is not valid" });
  } catch (error) {
    res.status(500).send({ message: `internal error: ${error}` });
  }
})

// deletes event, only event creator can do so
APIRouter.delete("/:id",tokenVerifier, async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.isValidObjectId(id)) {
      const validReq = await Event.findById(id);
      if (validReq) {
        if(!(req.user._id == validReq.eventCreatedBy)) {
          return res.status(400).send({ message: "User is not the same that created the event." });
        }
        await Event.findByIdAndDelete(id);
        res.status(200).send(`deleted event ${id}`);
      } else res.status(404).send({ message: "event not found" });
    } else res.status(400).send({ message: "invalid ID" });
  } catch (error) {
    res.status(500).send({ message: `internal error: ${error}` });
  }
});

module.exports = APIRouter;
