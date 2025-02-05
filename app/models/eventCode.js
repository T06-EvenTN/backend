//boilerplate
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = mongoose.model('eventCode', new Schema({
  code: {
    type: String,
    required: true,
    unique: true   
  },
  isValid: {
    type: Boolean,
    default: true  // per rendere il codice invalido
  },
  eventID: {
    type: String,
    default: ""  // per rendere il codice invalido
  }
}, {collection: 'dev-eventCodes'}));