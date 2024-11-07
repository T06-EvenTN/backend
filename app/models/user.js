//boilerplate
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = mongoose.model('User', new Schema({
  username: String,
  email: String,
  password: String,
  friends: [String],
  events: [String]
}, {collection: 'dev-users'}));