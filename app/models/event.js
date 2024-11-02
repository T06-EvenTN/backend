const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = mongoose.model('Event', new Schema({
  eventName: String,
  eventStart: Date,
  eventLength: Date,
  eventDescription: String,
  eventPosition: [Number],
}, {collection: 'dev-events'}));