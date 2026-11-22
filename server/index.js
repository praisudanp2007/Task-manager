import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { requireAuth } from './auth.js';
import { tasks, users } from './store.js';

const app = express();
const port = Number(process.env.PORT || 4000);
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'local-development-secret-change-me';

app.use(cors());
app.use(express.json());

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

function issueToken(user) {
  return jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));

app.post('/api/auth/register', async (request, response, next) => {
  try {
    const name = String(request.body.name ?? '').trim();
    const email = String(request.body.email ?? '').trim().toLowerCase();
    const password = String(request.body.password ?? '');
    if (!name || !email || password.length < 8) {
      return response.status(400).json({ error: 'Enter your name, a valid email, and a password with at least 8 characters.' });
    }
    const records = await users.all();
    if (records.some((user) => user.email === email)) {
      return response.status(409).json({ error: 'An account with this email already exists.' });
    }
    const user = { id: randomUUID(), name, email, passwordHash: await bcrypt.hash(password, 10) };
    records.push(user);
    await users.save(records);
    return response.status(201).json({ token: issueToken(user), user: publicUser(user) });
  } catch (error) { return next(error); }
});

app.post('/api/auth/login', async (request, response, next) => {
  try {
    const email = String(request.body.email ?? '').trim().toLowerCase();
    const password = String(request.body.password ?? '');
    const user = (await users.all()).find((record) => record.email === email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return response.status(401).json({ error: 'Email or password is incorrect.' });
    }
    return response.json({ token: issueToken(user), user: publicUser(user) });
  } catch (error) { return next(error); }
});

app.get('/api/tasks', requireAuth, async (request, response, next) => {
  try {
    const records = await tasks.all();
    return response.json(records.filter((task) => task.userId === request.userId).sort((a, b) => a.dueDate.localeCompare(b.dueDate)));
  } catch (error) { return next(error); }
});

app.post('/api/tasks', requireAuth, async (request, response, next) => {
  try {
    const title = String(request.body.title ?? '').trim();
    if (!title) return response.status(400).json({ error: 'A task title is required.' });
    const task = {
      id: randomUUID(), userId: request.userId, title,
      description: String(request.body.description ?? '').trim(),
      dueDate: request.body.dueDate || new Date().toISOString().slice(0, 10),
      priority: ['low', 'medium', 'high'].includes(request.body.priority) ? request.body.priority : 'medium',
      completed: false, createdAt: new Date().toISOString(),
    };
    const records = await tasks.all();
    records.push(task);
    await tasks.save(records);
    return response.status(201).json(task);
  } catch (error) { return next(error); }
});

app.patch('/api/tasks/:id', requireAuth, async (request, response, next) => {
  try {
    const records = await tasks.all();
    const index = records.findIndex((task) => task.id === request.params.id && task.userId === request.userId);
    if (index < 0) return response.status(404).json({ error: 'Task not found.' });
    const current = records[index];
    const updated = { ...current };
    if (request.body.title !== undefined) updated.title = String(request.body.title).trim();
    if (request.body.description !== undefined) updated.description = String(request.body.description).trim();
    if (request.body.dueDate !== undefined) updated.dueDate = request.body.dueDate;
    if (request.body.priority !== undefined && ['low', 'medium', 'high'].includes(request.body.priority)) updated.priority = request.body.priority;
    if (request.body.completed !== undefined) updated.completed = Boolean(request.body.completed);
    if (!updated.title) return response.status(400).json({ error: 'A task title is required.' });
    records[index] = updated;
    await tasks.save(records);
    return response.json(updated);
  } catch (error) { return next(error); }
});

app.delete('/api/tasks/:id', requireAuth, async (request, response, next) => {
  try {
    const records = await tasks.all();
    const remaining = records.filter((task) => !(task.id === request.params.id && task.userId === request.userId));
    if (remaining.length === records.length) return response.status(404).json({ error: 'Task not found.' });
    await tasks.save(remaining);
    return response.status(204).end();
  } catch (error) { return next(error); }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'Something went wrong. Please try again.' });
});

app.listen(port, () => console.log(`Task API listening at http://localhost:${port}`));
