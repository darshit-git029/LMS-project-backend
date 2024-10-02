import mongoose from "mongoose";
import dotenv from "dotenv"
dotenv.config();

const dbUrl:string = process.env.MONGODB_URL || "";

const connectDB = async () => {
    try{
        await mongoose.connect(dbUrl).then((data:any) => {
            console.log(`Database Connectes with ${data.connection.host}`)
        })
    }catch(error){
        console.log("Database is not Connected");
        
    }
}

export default connectDB