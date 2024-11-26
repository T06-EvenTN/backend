const express = require('express');
const APIRouter = express.Router();
const User = require('./models/user');
const Event = require('./models/event')
const mongoose = require('mongoose');
const bcrypt = require ('bcrypt');
const jwt = require ('jsonwebtoken');
const tokenVerifier = require('./tokenVerifier');


//get all users in users db
APIRouter.get('', async (req,res) => {
    let users = await User.find().exec();
    if(users){
      res.status(200).send(users);
    } else {
      res.status(500).send({message: 'no user found'});
    }
})

//create a new user
APIRouter.post('', async (req,res) => {
  try{
    if(!req.body.username) {
      return res.status(400).send({message: "username is empty"});
    }
    if(!req.body.email) {
      return res.status(400).send({message: "email is empty"});
    }
    if(!req.body.password) {
      return res.status(400).send({message: "password is empty"});
    }
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res.status(400).send({ message: "username is already taken" });
    }
    const existingEmail = await User.findOne({ email: req.body.email });
    if (existingEmail) {
      return res.status(400).send({ message: "email is already taken" });
    }
    const hashedPswd = await bcrypt.hash(req.body.password, 10);
    let user = new User({
      "username": req.body.username,
      "email": req.body.email,
      "password": hashedPswd,
      friends: [],
      events: []
    })
    user = await user.save();
    let userid = user.id;
    res.status(201).send(`created user ${userid}`);
  } catch(error){
    res.status(500).send({message: error});
  }
  //TODO: handle incorrect requests (400)
});

//login with username and password
APIRouter.post('/login', async (req,res) => {
  try{
    const user = await User.findOne({username: req.body.username});
    if(user === null){
      res.status(404).send({message: `no user found with username ${req.body.username}`});
    } else {
      if(await bcrypt.compare(req.body.password, user.password)){
        const accessToken = jwt.sign(user.toJSON(), process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' });
        res.cookie('token', accessToken);
        res.status(200).send({message: `logged in as ${req.body.username}`});
      } else {
        res.status(401).send({message: "password is incorrect."});
      }
    }
  }catch(error){
    res.status(500).send({message: error.toString()});
  }
})

//get a user from its id
APIRouter.get('', tokenVerifier, async (req,res) => {
  try{ 
    const{ id } = req.user._id;
    if(mongoose.isValidObjectId(id)){
      let user = await User.findById(id);
      if(user){
        res.status(200).send(user);
      } else {
        res.status(404).send({message: "no user found"});
      }
    } else res.status(400).send({message: "invalid user ID"});
  } catch(error){
    res.status(500).send({message: "internal error"});
  }
});

//delete a user from the db given its id
APIRouter.delete('',tokenVerifier, async (req,res) => {
  try{
    const { id } = req.user._id;
    if(mongoose.isValidObjectId(id)){
      const user = await User.findById(id);
      if(user){
        await User.findByIdAndDelete(id);
        res.status(200).send(`deleted user ${id}`);
      } else res.status(404).send({message: "user not found"});
    } else res.status(400).send({message: "invalid ID"});
  } catch (error) {
    res.status(500).send({message: `internal error: ${error}`});
  }
});

//replace user info
APIRouter.put('', tokenVerifier, async (req,res) => {
  try{
    const { id } = req.user._id;
    if(mongoose.isValidObjectId(id)){
      const user = await User.findById(id);
      if(user){ //TODO: add name and surname?
        const newUser = req.body.username ?? user.username;
        const newEmail = req.body.email ?? user.email;
        await User.findByIdAndUpdate(id, {
          "username": newUser,
          "email": newEmail,
        });
        res.status(200).send(`updated  user ${id}`);
      } else res.status(404).send({message: "user not found"});
    } else res.status(400).send({message: "invalid ID"});
  } catch (error) {
    res.status(500).send({message: `internal error: ${error}`});
  }
});

//get a user's friends from its id
APIRouter.get('/friends', tokenVerifier, async (req,res) => {
  try{  
    const{ id } = req.user._id;
    if(mongoose.isValidObjectId(id)){
      let user = await User.findById(id);
      if(user){
        const friendList = user.friends;
        res.status(200).send(friendList);
      } else {
        res.status(404).send({message: "no user found"});
      }
    } else res.status(400).send({message: "invalid user ID"});
  } catch(error){
    res.status(500).send({message: "internal error"});
  }
});

//add friend to a user
APIRouter.post('/friends/:id', tokenVerifier, async (req,res) => {
  try{
    if(!req.params.id){ //new friend id
      res.status(400).send({message: "Friend ID is not present."})
    }
    if(mongoose.isValidObjectId(req.user._id /*user id*/) && mongoose.isValidObjectId(req.params.id)){
      let user = await User.findById(req.user._id);
      if(user){
        let friendList = user.friends;
        let newFriend= await User.findById(req.params.id);
        //avoid adding same friend multiple times to an user, safety check
        if(newFriend){
          if (user.friends.includes(newFriend)) {
            return res.status(400).send({ message: "Friend is already added to this user." });
          }
          friendList.push(newFriend);
          await User.findByIdAndUpdate(id, {friends: friendList});
          res.status(201).send(`added user ${newFriend} to the friends of ${user.username}`);
        } else re.status(404).send({message: "friend not found"});
      } else res.status(404).send({message: "user not found"});
    } else res.status(400).send({message: "supplied user or friend ID is not valid"})
    
  } catch(error){
    res.status(500).send({message: error});
  }
});

//get a users events from its id
APIRouter.get('/events',tokenVerifier, async (req,res) => {
  try{  
    if(mongoose.isValidObjectId(req.user._id)){ 
      const{ user } = await User.findOne({_id:req.user._id});//if a user create an account, get the token and than delete the account the token is still legit for about 24 hours
      if(user){
        const userEventList = req.user.events;
        res.status(200).send(userEventList);
      } else {
        res.status(404).send({message: "no user found"});
      }
    } else res.status(400).send({message: "invalid user ID"});
  } catch(error){
    res.status(500).send({message: "internal error"});
  }
});

//add event to a user
APIRouter.post('/events/:id', tokenVerifier, async (req,res) => {
  try{
    const newEvent = req.params.id;
    if(!newEvent){
      return res.status(400).send({message: "Event ID is not present."})
    }
    if(mongoose.isValidObjectId(newEvent)&&mongoose.isValidObjectId(req.user._id)){
      let user = await User.findOne({_id:req.user._id});
      if (!user) {
        return res.status(404).send({ message: "User not found." });
      }
      let event = await Event.findById(newEvent);
      //avoid adding same event multiple time, safety check.
      if(event){
        let userEventList = user.events;
        if (userEventList.includes(newEvent)) {
          return res.status(400).send({ message: "Event is already added to this user." });
        } else{
          userEventList.push(newEvent);
          await User.findByIdAndUpdate(req.user, {events: userEventList});
          res.status(201).send(`added event ${newEvent} to the events of ${req.user.username}`);
        }
      } else res.status(404).send({message: "event not found"});
    } else res.status(400).send({message: "supplied user or event ID is not valid"})
    
  } catch(error){
    res.status(500).send({message: error});
  }
});

module.exports = APIRouter;