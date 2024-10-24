import { NextFunction, Response } from "express"
import usermodel from "../model/user.model"
import ErrorHandler from "../Utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import { redis } from "../Utils/redis";

//get user by id
export const getUserById = async (id: string, res: Response) => {
    const user = await usermodel.findById(id)
    if (user) {
      res.status(201).json({
        success: true,
        user,
      });
    }
  };


//get all user

export const getAllUserService = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const user = await usermodel.find().sort({ createdAt: -1 })


        res.status(200).json({
            success: true,
            user
        })

    } catch (error: any) {
        return (new ErrorHandler(error.message, 400))
    }
})

//update user role 
export const updateUserRoleService = CatchAsyncError(async (res: Response, id: string, role: string) => {
    const user = await usermodel.findByIdAndUpdate(id, { role }, { new: true })

    res.status(200).json({
        success: true,
        user
    })
})