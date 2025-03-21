const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const supertest = require('supertest');
const app = require('../../src/app');
const Admin = require('../../src/models/admin.model');
const Game = require('../../src/models/game.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const request = supertest(app);

describe('Admin API Integration Tests', () => {
  let mongoServer;
  let adminToken;
  let adminId;
  
  // Setup and teardown for MongoDB memory server
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Create test admin and get token
    const admin = await Admin.create({
      username: 'testadmin',
      password: await bcrypt.hash('Password123!', 10),
      name: 'Test Admin'
    });
    
    adminId = admin._id;
    adminToken = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '24h' }
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear game data between tests
    await Game.deleteMany({});
  });

  describe('Authentication', () => {
    it('should register a new admin', async () => {
      const response = await request
        .post('/api/admin/register')
        .send({
          username: 'newadmin',
          password: 'NewPassword123!',
          name: 'New Admin'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      
      // Verify admin was created
      const admin = await Admin.findOne({ username: 'newadmin' });
      expect(admin).not.toBeNull();
    });
    
    it('should login an admin and return token', async () => {
      const response = await request
        .post('/api/admin/login')
        .send({
          username: 'testadmin',
          password: 'Password123!'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });
    
    it('should reject login with invalid credentials', async () => {
      const response = await request
        .post('/api/admin/login')
        .send({
          username: 'testadmin',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
    
    it('should return admin profile when authenticated', async () => {
      const response = await request
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.admin.username).toBe('testadmin');
      expect(response.body.admin.name).toBe('Test Admin');
      expect(response.body.admin.password).toBeUndefined();
    });
    
    it('should update admin profile', async () => {
      const response = await request
        .put('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Admin Name',
          email: 'admin@example.com'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.admin.name).toBe('Updated Admin Name');
      expect(response.body.admin.email).toBe('admin@example.com');
    });
    
    it('should reject requests without valid token', async () => {
      const response = await request
        .get('/api/admin/profile');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('Game Management', () => {
    it('should create a new game', async () => {
      const response = await request
        .post('/api/admin/games')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Game',
          maxPlayers: 10,
          impostorCount: 2,
          emergencyMeetingsPerPlayer: 1
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.game.name).toBe('Test Game');
      expect(response.body.game.code).toMatch(/^[A-Z0-9]{6}$/);
      
      // Verify game was created and linked to admin
      const game = await Game.findById(response.body.game._id);
      expect(game).not.toBeNull();
      expect(game.adminId.toString()).toBe(adminId.toString());
    });
    
    it('should get all games for the admin', async () => {
      // Create test games
      await Game.create([
        {
          name: 'Game 1',
          code: 'ABC123',
          adminId,
          maxPlayers: 10,
          status: 'created'
        },
        {
          name: 'Game 2',
          code: 'DEF456',
          adminId,
          maxPlayers: 10,
          status: 'in-progress'
        }
      ]);
      
      const response = await request
        .get('/api/admin/games')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.games).toHaveLength(2);
      expect(response.body.games[0].name).toBe('Game 1');
      expect(response.body.games[1].name).toBe('Game 2');
    });
    
    it('should get a specific game by ID', async () => {
      // Create a test game
      const game = await Game.create({
        name: 'Specific Game',
        code: 'XYZ789',
        adminId,
        maxPlayers: 10,
        status: 'created'
      });
      
      const response = await request
        .get(`/api/admin/games/${game._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.game.name).toBe('Specific Game');
      expect(response.body.game.code).toBe('XYZ789');
    });
    
    it('should return 404 for non-existent game', async () => {
      const nonExistentId = mongoose.Types.ObjectId();
      
      const response = await request
        .get(`/api/admin/games/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
    
    it('should start a game', async () => {
      // Create a test game with players
      const game = await Game.create({
        name: 'Game To Start',
        code: 'START1',
        adminId,
        maxPlayers: 10,
        impostorCount: 1,
        status: 'created'
      });
      
      // Mock the necessary data for game start
      // In a real test, you'd need to add players and tasks
      
      const response = await request
        .put(`/api/admin/games/${game._id}/start`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      // Even without players, the endpoint should respond
      // (though it might not actually start the game)
      expect(response.status).toBe(400); // Expecting 400 because no players
      expect(response.body.success).toBe(false);
      
      // Additional test for successful game start would need proper setup
      // with adequate number of players and tasks
    });
    
    it('should end a game', async () => {
      // Create a test game
      const game = await Game.create({
        name: 'Game To End',
        code: 'END001',
        adminId,
        maxPlayers: 10,
        status: 'in-progress'
      });
      
      const response = await request
        .put(`/api/admin/games/${game._id}/end`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.game.status).toBe('completed');
      
      // Verify game status changed in database
      const updatedGame = await Game.findById(game._id);
      expect(updatedGame.status).toBe('completed');
    });
  });
});
