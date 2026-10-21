import request from 'supertest';
import { app, clearDb, registerAndLogin } from './helpers';

beforeEach(clearDb);

async function setup() {
  const { token, user } = await registerAndLogin('cards@example.com', 'Cards User');

  const board = await request(app)
    .post('/api/boards')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Cards Board' });

  const list = await request(app)
    .post(`/api/boards/${board.body.id}/lists`)
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Todo' });

  return { token, user, boardId: board.body.id as string, listId: list.body.id as string };
}

describe('List CRUD', () => {
  it('creates and retrieves lists', async () => {
    const { token, boardId } = await setup();

    const lists = await request(app)
      .get(`/api/boards/${boardId}/lists`)
      .set('Authorization', `Bearer ${token}`);

    expect(lists.status).toBe(200);
    expect(lists.body).toHaveLength(1);
    expect(lists.body[0].title).toBe('Todo');
  });

  it('updates a list title', async () => {
    const { token, listId } = await setup();

    const update = await request(app)
      .patch(`/api/boards/irrelevant/lists/${listId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'In Progress' });

    expect(update.status).toBe(200);
    expect(update.body.title).toBe('In Progress');
  });

  it('deletes a list', async () => {
    const { token, boardId, listId } = await setup();

    const del = await request(app)
      .delete(`/api/boards/${boardId}/lists/${listId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(del.status).toBe(204);
  });
});

describe('Card CRUD', () => {
  it('creates a card', async () => {
    const { token, listId } = await setup();

    const res = await request(app)
      .post(`/api/lists/${listId}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My Card' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('My Card');
    expect(res.body.position).toBe(1);
  });

  it('gets a card by id', async () => {
    const { token, listId } = await setup();

    const create = await request(app)
      .post(`/api/lists/${listId}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Detailed Card' });

    const get = await request(app)
      .get(`/api/cards/${create.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(get.status).toBe(200);
    expect(get.body.title).toBe('Detailed Card');
  });

  it('updates a card', async () => {
    const { token, listId } = await setup();

    const create = await request(app)
      .post(`/api/lists/${listId}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'To Update' });

    const update = await request(app)
      .patch(`/api/cards/${create.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated', description: 'New desc' });

    expect(update.status).toBe(200);
    expect(update.body.title).toBe('Updated');
    expect(update.body.description).toBe('New desc');
  });

  it('deletes a card', async () => {
    const { token, listId } = await setup();

    const create = await request(app)
      .post(`/api/lists/${listId}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'To Delete' });

    const del = await request(app)
      .delete(`/api/cards/${create.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(del.status).toBe(204);
  });

  it('moves a card to another list', async () => {
    const { token, boardId, listId } = await setup();

    const list2 = await request(app)
      .post(`/api/boards/${boardId}/lists`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Done' });

    const card = await request(app)
      .post(`/api/lists/${listId}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Movable Card' });

    const move = await request(app)
      .patch(`/api/cards/${card.body.id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ listId: list2.body.id, position: 1 });

    expect(move.status).toBe(200);
    expect(move.body.listId).toBe(list2.body.id);
  });
});

describe('Card Labels', () => {
  it('adds and deletes a label', async () => {
    const { token, listId } = await setup();

    const card = await request(app)
      .post(`/api/lists/${listId}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Labelled Card' });

    const addLabel = await request(app)
      .post(`/api/cards/${card.body.id}/labels`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bug', color: '#FF0000' });

    expect(addLabel.status).toBe(201);
    expect(addLabel.body.name).toBe('Bug');

    const delLabel = await request(app)
      .delete(`/api/cards/${card.body.id}/labels/${addLabel.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(delLabel.status).toBe(204);
  });
});

describe('Checklists', () => {
  it('creates a checklist with items and toggles completion', async () => {
    const { token, listId } = await setup();

    const card = await request(app)
      .post(`/api/lists/${listId}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Card with Checklist' });

    const checklist = await request(app)
      .post(`/api/cards/${card.body.id}/checklists`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Steps' });

    expect(checklist.status).toBe(201);

    const item = await request(app)
      .post(`/api/cards/${card.body.id}/checklists/${checklist.body.id}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'First step' });

    expect(item.status).toBe(201);
    expect(item.body.completed).toBe(false);

    const toggle = await request(app)
      .patch(`/api/cards/${card.body.id}/checklists/${checklist.body.id}/items/${item.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ completed: true });

    expect(toggle.status).toBe(200);
    expect(toggle.body.completed).toBe(true);
  });
});
