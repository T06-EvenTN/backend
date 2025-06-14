const { getAllUsers, getUserInfo } = require('../app/users');
const User = require('../app/models/user');
const mongoose = require('mongoose');

// Mock del modello User
jest.mock('../app/models/user');

describe('User Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { _id: '123456' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };
  });

  describe('getAllUsers', () => {
    it('ritorna lista utenti se trovati', async () => {
      const users = [{ username: 'Mario' }];
      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(users)
        })
      });

      await getAllUsers(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(users);
    });

    it('ritorna errore se nessun utente', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null)
        })
      });

      await getAllUsers(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ message: 'no user found' });
    });
  });

  describe('getUserInfo', () => {
    it('ritorna info utente se esiste', async () => {
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);
      const userMock = { username: 'Luigi' };
      User.findById.mockResolvedValue(userMock);

      await getUserInfo(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(userMock);
    });

    it('ritorna errore se user ID invalido', async () => {
      mongoose.isValidObjectId = jest.fn().mockReturnValue(false);

      await getUserInfo(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'invalid user ID' });
    });

    it('ritorna errore se utente non trovato', async () => {
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);
      User.findById.mockResolvedValue(null);

      await getUserInfo(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({ message: 'no user found' });
    });
  });
});
