const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['short', 'long', 'common'],
    default: 'short'
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  verificationMethod: {
    type: String,
    enum: ['qrcode', 'manual', 'home-assistant', 'timer'],
    default: 'manual'
  },
  verificationData: {
    // For QR code - the unique ID
    // For Home Assistant - entity_id or service to call
    // For timer - duration in seconds
    type: String
  },
  homeAssistantConfig: {
    entityId: String,
    action: String,
    targetState: mongoose.Schema.Types.Mixed,
    pollingInterval: Number
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to generate QR code verification data
TaskSchema.methods.generateQRCode = function() {
  if (this.verificationMethod === 'qrcode') {
    this.verificationData = `task-${this._id}-${Date.now()}`;
  }
  return this.verificationData;
};

// Static method to get tasks for a specific game
TaskSchema.statics.getTasksByGame = function(gameId) {
  return this.find({ gameId }).populate('room');
};

module.exports = mongoose.model('Task', TaskSchema);
