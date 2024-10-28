const express = require('express');

const app = express();
const PORT = process.env.PORT;

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


const mongoose = require('mongoose');
const uri = process.env.DATABASE_URL;

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function run() {
  try {
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await mongoose.disconnect();
  }
}
run().catch(console.dir);

