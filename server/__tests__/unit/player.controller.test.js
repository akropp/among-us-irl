const playerController = require('../../src/controllers/player.controller');
const Player = require('../../src/models/player.model');
const Game = require('../../src/models/game.model');

// Mock the models
jest.mock('../../src/models/player.model');
jest.mock('../../src/models/game.model');

describe('Player Controller', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('joinGame', () => {
    it('should successfully join a player to a game', async () => {
      // Mock request and response
      const req = {
        body: {
          gameCode: 'TEST123',
          playerName: 'TestPlayer',
          deviceId: 'device123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock Game.findOne to return a game
      Game.findOne.mockResolvedValue({
        _id: 'game123',
        code: 'TEST123',
        status: 'waiting',
        players: [],
        save: jest.fn().mockResolvedValue(true)
      });

      // Mock Player.findOne to return null (player doesn't exist)
      Player.findOne.mockResolvedValue(null);

      // Mock Player.create to return a new player
      Player.create.mockResolvedValue({
        _id: 'player123',
        name: 'TestPlayer',
        deviceId: 'device123',
        gameId: 'game123',
        color: 1
      });

      // Call the controller method
      await playerController.joinGame(req, res);

      // Assertions
      expect(Game.findOne).toHaveBeenCalledWith({ code: 'TEST123' });
      expect(Player.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        player: expect.objectContaining({
          _id: 'player123',
          name: 'TestPlayer'
        })
      }));
    });

    it('should return error if game not found', async () => {
      // Mock request and response
      const req = {
        body: {
          gameCode: 'INVALID',
          playerName: 'TestPlayer',
          deviceId: 'device123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Mock Game.findOne to return null (game not found)
      Game.findOne.mockResolvedValue(null);

      // Call the controller method
      await playerController.joinGame(req, res);

      // Assertions
      expect(Game.findOne).toHaveBeenCalledWith({ code: 'INVALID' });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('Game not found')
      }));
    });

    // Add more test cases for different scenarios
  });

  // Test other controller methods
});
