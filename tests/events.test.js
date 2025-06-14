const { createEvent } = require('../app/events');
const Event = require('../app/models/event');

// Mock di mongoose e modelli
jest.mock('../app/models/event');

describe('create event', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        eventName: 'Concerto',
        eventStart: new Date().toISOString(),
        eventLength: new Date(Date.now() + 3600000).toISOString(),
        eventDescription: 'Grande evento musicale',
        xcoord: 45.0,
        ycoord: 11.0,
        eventTag: 'Musica',
        eventImage: 'image.jpg'
      },
      user: { _id: '123456' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };
  });

  it('crea un evento correttamente se il tag è valido', async () => {
    Event.mockImplementation(() => ({
      save: jest.fn()
    }));

    await createEvent(req, res);

    expect(Event).toHaveBeenCalledWith(expect.objectContaining({
      eventName: 'Concerto',
      eventTag: 'Musica',
      eventCreatedBy: '123456'
    }));

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith('created event');
  });

  it('ritorna errore se il tag è invalido', async () => {
    req.body.eventTag = 'Invalido';

    await createEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'invalid tag' });
  });

  it('gestisce errori generici del server', async () => {
    Event.mockImplementation(() => {
      throw new Error('errore DB');
    });

    await createEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('errore DB');
  });
});
