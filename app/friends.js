const express = require('express');
const APIRouter = express.Router();
const User = require('./models/user');
const mongoose = require('mongoose');
const tokenVerifier = require('./middleware/tokenVerifier');

//get a user's friends from its id
APIRouter.get('', tokenVerifier, async (req, res) => {
    try {
        const { _id } = req.user;
        if (mongoose.isValidObjectId(_id)) {
            let user = await User.findById(_id);
            if (user) {
                const friendList = user.friends;
                res.status(200).send(friendList);
            } else {
                res.status(404).send({ message: "no user found" });
            }
        } else res.status(400).send({ message: "invalid user ID" });
    } catch (error) {
        res.status(500).send({ message: "internal error" });
    }
});
  
//add friend to a user
APIRouter.post('/:id', tokenVerifier, async (req, res) => {
    try {
        if (!req.params.id) { //new friend id
            res.status(400).send({ message: "Friend ID is not present." })
        }
        if (mongoose.isValidObjectId(req.user._id /*user id*/) && mongoose.isValidObjectId(req.params.id)) {
            let user = await User.findById(req.user._id);
            if (user) {
                let friendList = user.friends;
                let newFriend = await User.findById(req.params.id);
                //avoid adding same friend multiple times to an user, safety check
                if (newFriend) {
                    if (user.friends.includes(newFriend)) {
                        return res.status(400).send({ message: "Friend is already added to this user." });
                    }
                    friendList.push(newFriend);
                    await User.findByIdAndUpdate(id, { friends: friendList });
                    res.status(201).send(`added user ${newFriend} to the friends of ${user.username}`);
                } else re.status(404).send({ message: "friend not found" });
            } else res.status(404).send({ message: "user not found" });
        } else res.status(400).send({ message: "supplied user or friend ID is not valid" })

    } catch (error) {
        res.status(500).send({ message: error });
    }
});

module.exports = APIRouter;