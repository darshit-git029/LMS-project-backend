import express, { NextFunction, Request, Response } from "express"
import dotenv from "dotenv"
export const app = express()
import cors from "cors"
import cookieParser from "cookie-parser"
import { ErrorMiddleWare } from "./middleware/error"
import userRouter from "./Routes/user.route"
import courseRouter from "./Routes/course.route"
import orderRouter from "./Routes/order.routes"
import notificationRoute from "./Routes/notification.routes"
import analyticsRouter from "./Routes/analytics.route"
import layoutRouter from "./Routes/layout.route"

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
app.use("/api/v1",analyticsRouter)
app.use("/api/v2",courseRouter)
app.use("/api/v3",orderRouter)
app.use("/api/v4",notificationRoute)
app.use("/api/v5",layoutRouter)

app.all("*",(req:Request,res:Response,next:NextFunction) => {
    const error = new Error(`route ${req.originalUrl} not found`) as any
    error.statusCode = 404
    next(error)

})

app.use(ErrorMiddleWare)