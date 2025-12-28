const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/mobile_money_test';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  // Clean DB collections used by tests
  const { collections } = mongoose.connection;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('POST /api/savings validations', () => {
  let token;

  beforeEach(async () => {
    // register and login
    const reg = await request(app).post('/api/auth/register').send({
      nomComplet: 'Savings Tester',
      telephone: '0650000001',
      email: 'savings@test.local',
      motDePasse: 'password123'
    });
    token = reg.body.token;
  });

  it('should reject missing name', async () => {
    const res = await request(app)
      .post('/api/savings')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/nom/i);
  });

  it('should reject too long name', async () => {
    const long = 'x'.repeat(200);
    const res = await request(app)
      .post('/api/savings')
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: long });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/ne doit pas dépasser/);
  });

  it('should reject invalid objectifMontant', async () => {
    const res = await request(app)
      .post('/api/savings')
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: 'Valid name', objectifMontant: -100 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/objectif/i);
  });

  it('should reject invalid dateObjectif', async () => {
    const res = await request(app)
      .post('/api/savings')
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: 'Valid name', dateObjectif: 'not-a-date' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/date objectif/i);
  });

  it('should create a saving with valid data', async () => {
    const res = await request(app)
      .post('/api/savings')
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: 'Vacation', objectifMontant: 50000 });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('tirelire');
    expect(res.body.tirelire.nom).toBe('Vacation');
  });
});
