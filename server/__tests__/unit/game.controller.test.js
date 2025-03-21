const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const gameController = require('../../src/controllers/game.controller');
const Game = require('../../src/models/game.model');
const Player = require('../../src/models/player.model');
const Task = require('../../src/models/task.model');

// Mock response and request objects
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mock Socket.io
jest.mock('../../src/utils/socket', () => ({
  emitToRoom: jest.fn(),
  emitToPlayer: jest.fn(),
  getSocketIo: jest.fn().mockReturnValue({
    to: jest.fn().mockReturnValue({
      emit: jest.fn()
    })
  })
}));

describe('Game Controller', () => {
  let mongoServer;
  
  // Setup and teardown for MongoDB memory server
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear the database between tests
    await Game.deleteMany({});
    await Player.deleteMany({});
    await Task.deleteMany({});
  });

  describe('createGame', () => {
    it('should create a new game with valid input', async () => {
      const req = {
        body: {
          name: 'Test Game',
          maxPlayers: 10,
          impostorCount: 2,
          emergencyMeetingsPerPlayer: 1
        },
        user: { id: 'admin123' }
      };
      const res = mockResponse();

      await gameController.createGame(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          game: expect.objectContaining({
            name: 'Test Game',
            maxPlayers: 10,
            impostorCount: 2,
            code: expect.any(String)
          })
        })
      );

      // Verify game was created in the database
      const gamesInDb = await Game.find({});
      expect(gamesInDb).toHaveLength(1);
    });

    it('should return error when missing required fields', async () => {
      const req = {
        body: {},
        user: { id: 'admin123' }
      };
      const res = mockResponse();

      await gameController.createGame(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });

  describe('getGameById', () => {
    it('should return a game when valid ID is provided', async () => {
      // Create a game first
      const game = await Game.create({
        name: 'Test Game',
        code: 'ABCDEF',
        adminId: 'admin123',
        maxPlayers: 10,
        impostorCount: 2,
        status: 'created'
      });

      const req = {
        params: { id: game._id.toString() }
      };
      const res = mockResponse();

      await gameController.getGameById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          game: expect.objectContaining({
            name: 'Test Game',
            code: 'ABCDEF'
          })
        })
      );
    });

    it('should return 404 when game is not found', async () => {
      const req = {
        params: { id: mongoose.Types.ObjectId().toString() }
      };
      const res = mockResponse();

      await gameController.getGameById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });
  });

  describe('getGames', () => {
    it('should return all games for admin', async () => {
      // Create test games
      await Game.create([
        {
          name: 'Game 1',
          code: 'ABC123',
          adminId: 'admin123',
          maxPlayers: 10,
          status: 'created'
        },
        {
          name: 'Game 2',
          code: 'DEF456',
          adminId: 'admin123',
          maxPlayers: 10,
          status: 'in-progress'
        }
      ]);

      const req = {
        user: { id: 'admin123' }
      };
      const res = mockResponse();

      await gameController.getGames(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          games: expect.arrayContaining([
            expect.objectContaining({ name: 'Game 1' }),
            expect.objectContaining({ name: 'Game 2' })
          ])
        })
      );
    });
  });

  describe('startGame', () => {
    it('should start a game with valid ID', async () => {
      // Create a game and some players
      const game = await Game.create({
        name: 'Test Game',
        code: 'ABCDEF',
        adminId: 'admin123',
        maxPlayers: 10,
        impostorCount: 2,
        status: 'created'
      });

      // Add players to the game
      await Player.create([
        { name: 'Player 1', gameId: game._id, color: 1 },
        { name: 'Player 2', gameId: game._id, color: 2 },
        { name: 'Player 3', gameId: game._id, color: 3 },
        { name: 'Player 4', gameId: game._id, color: 4 },
        { name: 'Player 5', gameId: game._id, color: 5 }
      ]);

      // Add tasks
      await Task.create([
        { title: 'Task 1', description: 'Do something', gameId: game._id, location: 'Room 1' },
        { title: 'Task 2', description: 'Do something else', gameId: game._id, location: 'Room 2' }
      ]);

      const req = {
        params: { id: game._id.toString() },
        user: { id: 'admin123' }
      };
      const res = mockResponse();

      await gameController.startGame(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          game: expect.objectContaining({
            status: 'in-progress'
          })
        })
      );

      // Verify game state was updated
      const updatedGame = await Game.findById(game._id);
      expect(updatedGame.status).toBe('in-progress');

      // Verify players have roles assigned
      const players = await Player.find({ gameId: game._id });
      const impostors = players.filter(p => p.role === 'impostor');
      expect(impostors.length).toBe(2); // Based on game configuration
    });

    it('should return error when trying to start a game with insufficient players', async () => {
      // Create a game with minimum players set to 5
      const game = await Game.create({
        name: 'Test Game',
        code: 'ABCDEF',
        adminId: 'admin123',
        maxPlayers: 10,
        impostorCount: 2,
        status: 'created',
        minPlayers: 5
      });

      // Add only 3 players (less than minimum)
      await Player.create([
        { name: 'Player 1', gameId: game._id, color: 1 },
        { name: 'Player 2', gameId: game._id, color: 2 },
        { name: 'Player 3', gameId: game._id, color: 3 }
      ]);

      const req = {
        params: { id: game._id.toString() },
        user: { id: 'admin123' }
      };
      const res = mockResponse();

      await gameController.startGame(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Not enough players')
        })
      );
    });
  });

  describe('endGame', () => {
    it('should end a game with valid ID', async () => {
      // Create an in-progress game
      const game = await Game.create({
        name: 'Test Game',
        code: 'ABCDEF',
        adminId: 'admin123',
        maxPlayers: 10,
        impostorCount: 2,
        status: 'in-progress'
      });

      const req = {
        params: { id: game._id.toString() },
        user: { id: 'admin123' }
      };
      const res = mockResponse();

      await gameController.endGame(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          game: expect.objectContaining({
            status: 'completed'
          })
        })
      );

      // Verify game state was updated
      const updatedGame = await Game.findById(game._id);
      expect(updatedGame.status).toBe('completed');
    });
  });
});
