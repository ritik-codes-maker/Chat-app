import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import ChatMessage from './chatSchema.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '', method: ['GET', 'POST'] }
})

const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json())

app.get('/messages', async (req, res) => {
  try {
    const getMessages = await ChatMessage.find().sort({ created: 1 });
    res.json(getMessages);
  } catch (error) {
    res.json({ message: `error while fetching the messages ${error}` })
  }

})

io.on("connection", (socket) => {
  console.log("connection established ", socket.id);
  socket.on("sendMessage", async (data) => {
    try {
      const {user , message } = data;
      const chatMessage = new ChatMessage({user , message});
      await chatMessage.save();
      io.emit('message',chatMessage);
    } catch (error) {
        console.log("Error Saving the error message ", error );
    }
  })
  socket.on("disconnect", (reason) => {
    console.log("Socket got disconnected due to ", socket.id, reason);
  })
})


async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}
start();
