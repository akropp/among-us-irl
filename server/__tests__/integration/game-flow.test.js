const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Game = require('../../src/models/game.model');
const Player = require('../../src/models/player.model');
const Task = require('../../src/models/task.model');

// These tests require an actual MongoDB connection
// Use a test database to avoid affecting development data
describe('Game Flow Integration Tests', () => {
  beforeAll(async () => {
    // Connect to test database before tests
    const mongoUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/among-us-irl-test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Disconnect after tests
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await Game.deleteMany({});
    await Player.deleteMany({});
    await Task.deleteMany({});
  });

  describe('Game Creation and Player Joining', () => {
    it('should create a game and allow players to join', async () => {
      // 1. Create a game as admin
      const adminToken = 'admin-test-token'; // In a real test, generate this properly
      const createGameResponse = await request(app)
        .post('/api/admin/games')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Game',
          maxPlayers: 8,
          impostorCount: 2,
          emergencyMeetings: 1,
          locations: ['Kitchen', 'Living Room', 'Bedroom']
        });

      expect(createGameResponse.status).toBe(201);
      expect(createGameResponse.body.success).toBe(true);
      expect(createGameResponse.body.game).toBeDefined();
      expect(createGameResponse.body.game.code).toBeDefined();

      const gameCode = createGameResponse.body.game.code;

      // 2. Join the game as player 1
      const joinPlayer1Response = await request(app)
        .post('/api/players/join')
        .send({
          gameCode: gameCode,
          playerName: 'Player 1',
          deviceId: 'device-id-1'
        });

      expect(joinPlayer1Response.status).toBe(201);
      expect(joinPlayer1Response.body.success).toBe(true);
      expect(joinPlayer1Response.body.player).toBeDefined();
      expect(joinPlayer1Response.body.player.name).toBe('Player 1');

      // 3. Join the game as player 2
      const joinPlayer2Response = await request(app)
        .post('/api/players/join')
        .send({
          gameCode: gameCode,
          playerName: 'Player 2',
          deviceId: 'device-id-2'
        });

      expect(joinPlayer2Response.status).toBe(201);
      expect(joinPlayer2Response.body.success).toBe(true);

      // 4. Verify that the game has both players
      const getGameResponse = await request(app)
        .get(`/api/admin/games/${createGameResponse.body.game._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getGameResponse.status).toBe(200);
      expect(getGameResponse.body.success).toBe(true);
      expect(getGameResponse.body.game.players.length).toBe(2);
    });
  });

  // Additional game flow tests could include:
  // - Starting a game
  // - Assigning tasks
  // - Completing tasks
  // - Calling emergency meetings
  // - Voting
  // - End game conditions
});
