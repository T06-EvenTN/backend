//boilerplate
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = mongoose.model('User', new Schema({
  username: String,
  name: String,
  surname: String,
  email: String,
  phone: String,
  password: String,
  friends: [String],
  events: [String]
}, {collection: 'dev-users'}));