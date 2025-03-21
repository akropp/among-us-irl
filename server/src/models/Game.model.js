const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const GameSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    default: () => uuidv4().substring(0, 6).toUpperCase()
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['setup', 'in-progress', 'discussion', 'voting', 'completed'],
    default: 'setup'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  settings: {
    imposterCount: {
      type: Number,
      default: 1,
      min: 1
    },
    discussionTime: {
      type: Number,
      default: 120,  // seconds
      min: 30
    },
    votingTime: {
      type: Number,
      default: 60,   // seconds
      min: 15
    },
    killCooldown: {
      type: Number,
      default: 45,   // seconds
      min: 10
    },
    emergencyMeetings: {
      type: Number,
      default: 1,
      min: 0
    }
  },
  currentRound: {
    type: Number,
    default: 0
  },
  currentMeeting: {
    type: Object,
    default: null
  },
  rooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }],
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  logs: [{
    type: {
      type: String,
      enum: ['join', 'leave', 'kill', 'report', 'meeting', 'vote', 'task', 'game-start', 'game-end']
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
});

// Generate a new game code
GameSchema.methods.generateNewCode = function() {
  this.code = uuidv4().substring(0, 6).toUpperCase();
  return this.code;
};

// Add a log entry
GameSchema.methods.addLog = function(logData) {
  this.logs.push(logData);
};

module.exports = mongoose.model('Game', GameSchema);
