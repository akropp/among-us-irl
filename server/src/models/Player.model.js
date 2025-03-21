const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  deviceId: {
    type: String,
    required: true
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  role: {
    type: String,
    enum: ['crewmate', 'impostor'],
    default: 'crewmate'
  },
  isAlive: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    enum: ['red', 'blue', 'green', 'pink', 'orange', 'yellow', 'black', 'white', 'purple', 'brown', 'cyan', 'lime'],
    required: true
  },
  completedTasks: [{
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  assignedTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  emergencyMeetingsLeft: {
    type: Number,
    default: 1
  },
  lastKill: {
    type: Date
  },
  currentRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  connected: {
    type: Boolean,
    default: true
  },
  voteSubmitted: {
    votedFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    meetingId: String,
    timestamp: Date
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
});

// Method to check if player can kill
PlayerSchema.methods.canKill = function(killCooldown) {
  if (!this.lastKill) return true;
  
  const now = new Date();
  const cooldownTime = new Date(this.lastKill.getTime() + (killCooldown * 1000));
  
  return now >= cooldownTime;
};

// Method to check if player has completed all tasks
PlayerSchema.methods.hasCompletedAllTasks = function() {
  return this.completedTasks.length === this.assignedTasks.length;
};

// Method to mark a task as completed
PlayerSchema.methods.completeTask = function(taskId) {
  if (!this.completedTasks.find(ct => ct.task.toString() === taskId.toString())) {
    this.completedTasks.push({
      task: taskId,
      completedAt: new Date()
    });
  }
};

module.exports = mongoose.model('Player', PlayerSchema);
