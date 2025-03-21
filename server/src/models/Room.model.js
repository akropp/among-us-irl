const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  homeAssistantEntities: [{
    entityId: {
      type: String,
      required: true
    },
    description: String,
    type: {
      type: String,
      enum: ['light', 'switch', 'sensor', 'media_player', 'script', 'other'],
      default: 'other'
    }
  }],
  imageUrl: {
    type: String
  },
  qrCode: {
    type: String
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

// Static method to get rooms for a specific game
RoomSchema.statics.getRoomsByGame = function(gameId) {
  return this.find({ gameId });
};

// Method to generate QR code for room
RoomSchema.methods.generateQRCode = function() {
  this.qrCode = `room-${this._id}-${Date.now()}`;
  return this.qrCode;
};

module.exports = mongoose.model('Room', RoomSchema);
