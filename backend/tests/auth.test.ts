import request from 'supertest';
import { app, clearDb } from './helpers';

beforeEach(clearDb);

describe('POST /api/auth/register', () => {
  it('creates a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('returns 409 for duplicate email', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'test@example.com', name: 'Test User', password: 'password123',
    });
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com', name: 'Other User', password: 'password456',
    });
    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email', name: 'Test', password: 'password123',
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 for short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com', name: 'Test', password: '123',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      email: 'login@example.com', name: 'Login User', password: 'password123',
    });
  });

  it('returns token for valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com', password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com', password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com', password: 'password123',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns user info for authenticated request', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      email: 'me@example.com', name: 'Me User', password: 'password123',
    });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('me@example.com');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
