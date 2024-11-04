const express = require('express');
const APIRouter = express.Router();
const User = require('./models/user');
const mongoose = require('mongoose');

APIRouter.get('', async (req,res) => {
    let users = await User.find().exec();
    if(users){
      res.status(200).send(users);
    } else {
      res.status(500).send({message: 'no user found'});
    }
    //TODO: actual error handling
})

APIRouter.get('/:id', async (req,res) => {
  try{  
    const{ id } = req.params;
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

APIRouter.post('', async (req,res) => {
  let user = new User({
    "username": req.body.username,
    "email": req.body.email,
    friends: [],
    events: []
  })
  user = await user.save();
  let userid = user.id;
  res.status(201).send(`created user ${userid}`);
  //TODO: handle incorrect requests (400) and server errors 
});

APIRouter.delete('/:id', async (req,res) => {
  try{
    const { id } = req.params;
    if(mongoose.isValidObjectId(id)){
      const validReq = await User.findById(id);
      if(validReq){
        const deletion = await User.findByIdAndDelete(id);
        res.status(200).send(`deleted user ${id}`);
      } else res.status(404).send({message: "user not found"});
    } else res.status(400).send({message: "invalid ID"});
  } catch (error) {
    res.status(500).send({message: `internal error: ${error}`});
  }
})

//TODO: capire a cosa serve lol
module.exports = APIRouter;