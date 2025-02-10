const express = require("express");
const APIRouter = express.Router();
const User = require("./models/user");
const Event = require("./models/event");
const mongoose = require("mongoose");
const tokenVerifier = require("./middleware/tokenVerifier");

//get all users in users db
APIRouter.get("/all", async (req, res) => {
    let users = await User.find({}).select("-password").exec();
    if (users) {
        res.status(200).send(users);
    } else {
        res.status(500).send({ message: "no user found" });
    }
});

//get a user from its id
APIRouter.get("/info", tokenVerifier, async (req, res) => {
    try {
        const { _id } = req.user;
        if (mongoose.isValidObjectId(_id)) {
            let user = await User.findById(_id);
            if (user) {
                res.status(200).send(user);
            } else {
                res.status(404).send({ message: "no user found" });
            }
        } else res.status(400).send({ message: "invalid user ID" });
    } catch (error) {
        res.status(500).send({ message: "internal error" });
    }
});

// search a user with the username, exact match
APIRouter.get("/search/:name", tokenVerifier, async (req, res) => {
    try {
        const username = req.params.name;
        if (!username) {
            return res.status(400).send({ message: "username is required" });
        }
        let users = await User.findOne({
            username: { $regex: username, $options: "i" },
        }).select("-password");
        if (users) {
            return res.status(200).send(users);
        } else {
            return res.status(404).send({ message: "no users found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "internal error" });
    }
});

//get a users events from its id
APIRouter.get("/events", tokenVerifier, async (req, res) => {
    try {
        if (mongoose.isValidObjectId(req.user._id)) {
            //if a user create an account, get the token and than delete the account the token is still legit for about 24 hours
            const user = await User.findOne({ _id: req.user._id });
            if (user) {
                const userEventList = user.events;
                res.status(200).send(userEventList);
            } else {
                res.status(404).send({ message: "no user found" });
            }
        } else res.status(400).send({ message: "invalid user ID" });
    } catch (error) {
        res.status(500).send({ message: "internal error" });
    }
});

//add event to a user
APIRouter.post("/events/:id", tokenVerifier, async (req, res) => {
    try {
        const newEvent = req.params.id;
        if (!newEvent) {
            return res
                .status(400)
                .send({ message: "Event ID is not present." });
        }
        if (
            mongoose.isValidObjectId(newEvent) &&
            mongoose.isValidObjectId(req.user._id)
        ) {
            let user = await User.findOne({ _id: req.user._id });
            if (!user) {
                return res.status(404).send({ message: "User not found." });
            }
            let event = await Event.findById(newEvent);
            //avoid adding same event multiple time, safety check.
            if (event) {
                let userEventList = user.events;
                if (userEventList.includes(newEvent)) {
                    return res
                        .status(400)
                        .send({
                            message: "Event is already added to this user.",
                        });
                } else {
                    userEventList.push(newEvent);
                    await User.findByIdAndUpdate(req.user._id, {
                        events: userEventList,
                    });
                    res.status(201).send(
                        `added event ${newEvent} to the events of ${req.user.username}`
                    );
                }
            } else res.status(404).send({ message: "event not found" });
        } else
            res.status(400).send({
                message: "supplied user or event ID is not valid",
            });
    } catch (error) {
        res.status(500).send({ message: error });
    }
});

//remove event from a user
APIRouter.delete("/events/:id", tokenVerifier, async (req, res) => {
    try {
        const oldEvent = req.params.id;
        if (!oldEvent) {
            return res
                .status(400)
                .send({ message: "Event ID is not present." });
        }
        if (
            mongoose.isValidObjectId(oldEvent) &&
            mongoose.isValidObjectId(req.user._id)
        ) {
            let user = await User.findOne({ _id: req.user._id });
            if (!user) {
                return res.status(404).send({ message: "User not found." });
            }
            let event = await Event.findById(oldEvent);
            //avoid adding same event multiple time, safety check.
            if (event) {
                let userEventList = user.events;
                if (!userEventList.includes(oldEvent)) {
                    return res
                        .status(400)
                        .send({
                            message: "Event hasn't been added to this user.",
                        });
                } else {
                    userEventList = userEventList.filter(function (item) {
                        return item !== req.params.id;
                    });
                    await User.findByIdAndUpdate(req.user._id, {
                        events: userEventList,
                    });
                    res.status(201).send(
                        `removed event ${oldEvent} to the events of ${req.user.username}`
                    );
                }
            } else res.status(404).send({ message: "event not found" });
        } else
            res.status(400).send({
                message: "supplied user or event ID is not valid",
            });
    } catch (error) {
        res.status(500).send({ message: error });
    }
});

module.exports = APIRouter;
