const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
require('dotenv').config();

console.log("Loaded MONGO_URI:", process.env.MONGO_URI);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB connected');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Define schema and model
const TaskSchema = new mongoose.Schema({
  title: String,
  status: String,
  owner: String,
  sharedWith: [String],
});
const Task = mongoose.model('Task', TaskSchema);

// RESTful API routes
app.get('/tasks/:email', async (req, res) => {
  const tasks = await Task.find({
    $or: [{ owner: req.params.email }, { sharedWith: req.params.email }],
  });
  res.json(tasks);
});

app.post('/tasks', async (req, res) => {
  const task = new Task(req.body);
  await task.save();
  io.emit('task-updated');
  res.json(task);
});

app.put('/tasks/:id', async (req, res) => {
  await Task.findByIdAndUpdate(req.params.id, req.body);
  io.emit('task-updated');
  res.sendStatus(200);
});

app.delete('/tasks/:id', async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  io.emit('task-updated');
  res.sendStatus(200);
});

// WebSocket events
io.on('connection', (socket) => {
  console.log('⚡ Client connected:', socket.id);
});

server.listen(5000, () => {
  console.log('🚀 Backend running on port 5000');
});
