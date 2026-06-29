const mongoose = require('mongoose');

const animalSchema = new mongoose.Schema({
  type: String,
  breed: String,
  color: String,
  health: String,
  location: String,
  status: String,
  found: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Animal', animalSchema);
