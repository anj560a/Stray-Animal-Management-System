const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  name: String,
  type: String,
  location: String,
  description: String,
  status: { type:String, default:'Submitted' },
  createdAt: { type:Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);

