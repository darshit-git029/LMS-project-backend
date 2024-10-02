import express, { NextFunction, Request, Response } from "express"
import dotenv from "dotenv"
export const app = express()
import cors from "cors"
import cookieParser from "cookie-parser"
import { ErrorMiddleWare } from "./middleware/error"
import userRouter from "./Routes/user.route"

dotenv.config()

//body-parser
app.use(express.json({limit:"50mb"}))

//cookie-parser
app.use(cookieParser())

//cors
app.use(cors({origin:process.env.ORIGIN}))

app.get("/test",(req:Request,res:Response,next:NextFunction) => {
    res.status(200).json({
        success:true,
        message:"API is working"
    })
})

app.use("/api/v1",userRouter)


app.all("*",(req:Request,res:Response,next:NextFunction) => {
    const error = new Error(`route ${req.originalUrl} not found`) as any
    error.statusCode = 404
    next(error)

})

app.use(ErrorMiddleWare)