const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const adminController = require('../../src/controllers/admin.controller');
const Admin = require('../../src/models/admin.model');
const Game = require('../../src/models/game.model');

// Mock environment variables
process.env.JWT_SECRET = 'test_secret';
process.env.JWT_EXPIRY = '24h';

// Mock response and request objects
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Admin Controller', () => {
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
    await Admin.deleteMany({});
    await Game.deleteMany({});
  });

  describe('register', () => {
    it('should register a new admin with valid credentials', async () => {
      const req = {
        body: {
          username: 'testadmin',
          password: 'Password123!',
          name: 'Test Admin'
        }
      };
      const res = mockResponse();

      await adminController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String)
        })
      );

      // Verify admin was created in the database
      const admin = await Admin.findOne({ username: 'testadmin' });
      expect(admin).not.toBeNull();
      expect(admin.name).toBe('Test Admin');
      
      // Verify password was hashed
      const passwordMatch = await bcrypt.compare('Password123!', admin.password);
      expect(passwordMatch).toBe(true);
    });

    it('should return error when username already exists', async () => {
      // Create an admin first
      await Admin.create({
        username: 'existingadmin',
        password: await bcrypt.hash('password', 10),
        name: 'Existing Admin'
      });

      const req = {
        body: {
          username: 'existingadmin',
          password: 'Password123!',
          name: 'Test Admin'
        }
      };
      const res = mockResponse();

      await adminController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('already exists')
        })
      );
    });

    it('should return error when required fields are missing', async () => {
      const req = {
        body: {
          name: 'Test Admin'
          // Missing username and password
        }
      };
      const res = mockResponse();

      await adminController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Create a test admin for login tests
      await Admin.create({
        username: 'testadmin',
        password: await bcrypt.hash('Password123!', 10),
        name: 'Test Admin'
      });
    });

    it('should login admin with valid credentials and return token', async () => {
      const req = {
        body: {
          username: 'testadmin',
          password: 'Password123!'
        }
      };
      const res = mockResponse();

      await adminController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: expect.any(String)
        })
      );

      // Verify the token can be decoded
      const responseData = res.json.mock.calls[0][0];
      const decodedToken = jwt.verify(responseData.token, process.env.JWT_SECRET);
      expect(decodedToken).toHaveProperty('id');
      expect(decodedToken).toHaveProperty('username', 'testadmin');
    });

    it('should return error for invalid username', async () => {
      const req = {
        body: {
          username: 'nonexistentadmin',
          password: 'Password123!'
        }
      };
      const res = mockResponse();

      await adminController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid credentials')
        })
      );
    });

    it('should return error for invalid password', async () => {
      const req = {
        body: {
          username: 'testadmin',
          password: 'WrongPassword!'
        }
      };
      const res = mockResponse();

      await adminController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid credentials')
        })
      );
    });
  });

  describe('getProfile', () => {
    it('should return admin profile when authenticated', async () => {
      // Create an admin
      const admin = await Admin.create({
        username: 'testadmin',
        password: await bcrypt.hash('password', 10),
        name: 'Test Admin'
      });

      const req = {
        user: { id: admin._id.toString(), username: 'testadmin' }
      };
      const res = mockResponse();

      await adminController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          admin: expect.objectContaining({
            username: 'testadmin',
            name: 'Test Admin'
          })
        })
      );
      
      // Ensure password is not returned
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.admin).not.toHaveProperty('password');
    });
  });

  describe('updateProfile', () => {
    it('should update admin profile with valid data', async () => {
      // Create an admin
      const admin = await Admin.create({
        username: 'testadmin',
        password: await bcrypt.hash('password', 10),
        name: 'Test Admin'
      });

      const req = {
        user: { id: admin._id.toString() },
        body: {
          name: 'Updated Admin Name',
          email: 'admin@example.com'
        }
      };
      const res = mockResponse();

      await adminController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          admin: expect.objectContaining({
            name: 'Updated Admin Name',
            email: 'admin@example.com'
          })
        })
      );

      // Verify the database was updated
      const updatedAdmin = await Admin.findById(admin._id);
      expect(updatedAdmin.name).toBe('Updated Admin Name');
      expect(updatedAdmin.email).toBe('admin@example.com');
    });

    it('should update password when provided', async () => {
      // Create an admin
      const admin = await Admin.create({
        username: 'testadmin',
        password: await bcrypt.hash('password', 10),
        name: 'Test Admin'
      });

      const req = {
        user: { id: admin._id.toString() },
        body: {
          currentPassword: 'password',
          newPassword: 'NewPassword123!'
        }
      };
      const res = mockResponse();

      await adminController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      // Verify password was updated
      const updatedAdmin = await Admin.findById(admin._id);
      const passwordMatch = await bcrypt.compare('NewPassword123!', updatedAdmin.password);
      expect(passwordMatch).toBe(true);
    });

    it('should return error when current password is incorrect', async () => {
      // Create an admin
      const admin = await Admin.create({
        username: 'testadmin',
        password: await bcrypt.hash('password', 10),
        name: 'Test Admin'
      });

      const req = {
        user: { id: admin._id.toString() },
        body: {
          currentPassword: 'wrongpassword',
          newPassword: 'NewPassword123!'
        }
      };
      const res = mockResponse();

      await adminController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Current password is incorrect')
        })
      );
    });
  });
});
