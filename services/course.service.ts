import { NextFunction, Response } from "express";
import courseModel from "../model/course.model";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../Utils/ErrorHandler";
import { log } from "console";

//create course

export const createCourse = CatchAsyncError(async (data: any, res: Response) => {
    try{

        const course = await courseModel.create(data)
        
        res.status(200).json({
            success: true,
            course
        })
    }catch(error:any){
        console.log(error.message)
    }
})


//get all course

export const getAllCourseService = CatchAsyncError(async (req:Request,res:Response,next:NextFunction) => {
    try{

        const course = await courseModel.find().sort({createdAt:-1})
        
        res.status(200).json({
            success: true,
            course
        })
    }catch(error:any){
        console.log(error.message)
        return next(new ErrorHandler(error.message,400))

    }
})

