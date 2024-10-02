import { app } from './app';
import dotenv from 'dotenv';
import connectDB from './Utils/db';
dotenv.config();


app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
  connectDB();
});
