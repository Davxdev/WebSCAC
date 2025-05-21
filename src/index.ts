import express from 'express';
import dotenv from 'dotenv';
import messageRoutes from './routes/message.routes';
import { startMessageConsumer } from './consumers/message.consumer';
import { connectDatabase } from './config/database';
import cors from "cors";
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();
const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true
}));
app.use(express.static('public'));
app.use(express.json());
app.use('/api/messages', messageRoutes);

const PORT = process.env.PORT || 3000;

connectDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
  });
  startMessageConsumer();
});
