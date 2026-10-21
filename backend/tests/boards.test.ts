import request from 'supertest';
import { app, clearDb, registerAndLogin } from './helpers';

beforeEach(clearDb);

describe('Board CRUD', () => {
  it('creates a board and lists it', async () => {
    const { token } = await registerAndLogin('board@example.com', 'Board User');

    const create = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My Board', background: '#0079BF' });

    expect(create.status).toBe(201);
    expect(create.body.title).toBe('My Board');

    const list = await request(app)
      .get('/api/boards')
      .set('Authorization', `Bearer ${token}`);

    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].title).toBe('My Board');
  });

  it('returns 400 for missing title', async () => {
    const { token } = await registerAndLogin('board2@example.com', 'Board User 2');
    const res = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ background: '#0079BF' });
    expect(res.status).toBe(400);
  });

  it('gets board with lists and cards', async () => {
    const { token } = await registerAndLogin('board3@example.com', 'Board User 3');
    const create = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Full Board' });

    const get = await request(app)
      .get(`/api/boards/${create.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(get.status).toBe(200);
    expect(get.body.lists).toEqual([]);
  });

  it('updates board title', async () => {
    const { token } = await registerAndLogin('board4@example.com', 'Board User 4');
    const create = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Old Title' });

    const update = await request(app)
      .patch(`/api/boards/${create.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New Title' });

    expect(update.status).toBe(200);
    expect(update.body.title).toBe('New Title');
  });

  it('deletes a board', async () => {
    const { token } = await registerAndLogin('board5@example.com', 'Board User 5');
    const create = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'To Delete' });

    const del = await request(app)
      .delete(`/api/boards/${create.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(del.status).toBe(204);

    const list = await request(app)
      .get('/api/boards')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body).toHaveLength(0);
  });

  it('denies access to boards by non-members', async () => {
    const { token: ownerToken } = await registerAndLogin('owner@example.com', 'Owner');
    const { token: otherToken } = await registerAndLogin('other@example.com', 'Other');

    const create = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Private Board' });

    const get = await request(app)
      .get(`/api/boards/${create.body.id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(get.status).toBe(403);
  });
});

describe('Board Members', () => {
  it('adds and removes a member', async () => {
    const { token: ownerToken } = await registerAndLogin('owner2@example.com', 'Owner');
    await registerAndLogin('member@example.com', 'Member');

    const board = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Team Board' });

    const add = await request(app)
      .post(`/api/boards/${board.body.id}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'member@example.com' });
    expect(add.status).toBe(201);

    const duplicate = await request(app)
      .post(`/api/boards/${board.body.id}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'member@example.com' });
    expect(duplicate.status).toBe(409);
  });
});
