const express = require('express');
const APIRouter = express.Router();
const User = require('./models/user');
const mongoose = require('mongoose');
const bcrypt = require ('bcrypt');


//get all users in users db
APIRouter.get('', async (req,res) => {
    let users = await User.find().exec();
    if(users){
      res.status(200).send(users);
    } else {
      res.status(500).send({message: 'no user found'});
    }
    //TODO: actual error handling
})

//get a user from its id
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

//create a new user
APIRouter.post('', async (req,res) => {
  try{
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

//login with email and password
APIRouter.post('/login', async (req,res) => {
  try{
    const user = await User.findOne({username: req.body.username});
    if(user === null){
      res.status(400).send({message: `no user found with username ${req.body.username}`});
    } else {
      if(await bcrypt.compare(req.body.password, user.password)){
        res.status(200).send({message: "login successful"});
      } else {
        res.status(400).send({mesage: "password is incorrect."});
      }
    }
  }catch(error){
    res.status(500).send({message: error});
  }
})

//delete a user from the db given its id
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
});

//replace user info
APIRouter.put('/:id', async (req,res) => {
  try{
    const { id } = req.params;
    if(mongoose.isValidObjectId(id)){
      const validReq = await User.findById(id);
      if(validReq){
        const newUser = req.body.username ?? validReq.username;
        const newEmail = req.body.email ?? validReq.email;
        const updateUser = await User.findByIdAndUpdate(id, {
          "username": newUser,
          "email": newEmail,
        });
        res.status(200).send(`updated  user ${id}`);
      } else res.status(404).send({message: "user not found"});
    } else res.status(400).send({message: "invalid ID"});
  } catch (error) {
    res.status(500).send({message: `internal error: ${error}`});
  }
})

//TODO: capire a cosa serve lol
module.exports = APIRouter;