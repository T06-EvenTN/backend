const express = require('express');

const app = express();
const PORT = 8080;

app.use(express.json());

app.listen(
  PORT,
  () => console.log(`application started on http://localhost:${PORT}`)
);

app.get(`/test`, (req,res) => {
  res.status(200).send("yay!");
})


//TODO: actually implement this. this is just a test endpoint
app.post(`/user`, (req,res) => {
  const {id,email,userType} = req.body;
  console.log(`creating user with id ${id}, email ${email} and admin privileges of ${userType}`);

  if(Number(id)<1){
    res.status(400).send({message: `an ID of ${id} is not valid`})
  } else {
    res.status(201).send(`${id}`);
  }
})