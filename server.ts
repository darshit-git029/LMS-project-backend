import { app } from './app';
import {v2 as cloudeinary} from "cloudinary"
import dotenv from 'dotenv';
import connectDB from './Utils/db';
import http from "http"
import { Socket } from 'socket.io';
import { initSocketServer } from './socketserver';
const server = http.createServer(app)
dotenv.config();


//cloudeinary configration
cloudeinary.config({
  cloud_name:process.env.CLOUDE_NAME,
  api_key:process.env.CLOUDE_API,
  api_secret:process.env.CLOUDE_SECRET_KEY
  
})
initSocketServer(server)

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
  connectDB();
});
  