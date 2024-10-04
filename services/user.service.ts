import { NextFunction, Response } from "express"
import usermodel from "../model/user.model"
import ErrorHandler from "../Utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncError";

//get user by id
export const getUserById = async (id:string,res:Response) => {
    try{

        const user = await usermodel.findById(id)
        res.status(200).json({
            success:true,
            user,
        })
    } catch(error:any){
        return (new ErrorHandler(error.message,400))
    }
}


//get all user

export const getAllUserService = CatchAsyncError(async(req:Request,res:Response,next:NextFunction) => {
    try {

        const user = await usermodel.find().sort({createdAt:-1})
   
        
        res.status(200).json({
            success:true,
            user
        })
        
    } catch (error:any) {
        return (new ErrorHandler(error.message,400))
    }
})