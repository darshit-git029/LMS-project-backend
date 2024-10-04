import { NextFunction, Response } from "express"
import ErrorHandler from "../Utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import orderModel from "../model/order.model";


export const newOrder = CatchAsyncError(async(data:any,res:Response,next:NextFunction) => {
    try {

        const order = await orderModel.create(data)
        res.status(200).json({
            success: true,
            order
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message,400))
    }
})


export const getAllOrderservice = CatchAsyncError(async(req:Request,res:Response,next:NextFunction) => {
    try {

        const order = await orderModel.find().sort({createdAt:-1})
        res.status(200).json({
            success: true,
            order
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message,400))
    }
})