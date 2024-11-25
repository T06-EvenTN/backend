const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventTags = ['Musica', 'Festival', 'Sport', 'Conferenza', 'Sagra'];

module.exports = mongoose.model('Event', new Schema({
  eventName: String,
  eventStart: Date,
  eventLength: Date,
  eventDescription: String,
  eventPosition: [Number],
  eventPresence: Number,
  eventTag: {
    type: String,
    enum: eventTags, 
    required: true 
  }
}, {collection: 'dev-events'}));