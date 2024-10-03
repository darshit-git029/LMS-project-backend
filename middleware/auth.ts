import { Response, Request, NextFunction } from "express";
import { CatchAsyncError } from "./catchAsyncError";
import ErrorHandler from "../Utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../Utils/redis";

export const isAuthenticate = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    console.log("....authentication....");
    
    const acceess_token = req.cookies.access_token as string
    if (!acceess_token) {
        return next(new ErrorHandler("Please login to access this resource", 400))
    }

    const decoded = jwt.verify(acceess_token, process.env.ACCESS_TOKEN as string) as JwtPayload
    if (!decoded) {
        return next(new ErrorHandler("Access token is not valid", 400))
    }

    const user = await redis.get(decoded.id)
    if (!user) {
        return next(new ErrorHandler("User not found", 400))
    }

    req.user = JSON.parse(user)
    next()

})


export const authoraiseRole = (...roles: string[]) => {

    return (req: Request, res: Response, next: NextFunction) => {
        console.log("....role of user....");

        if (!roles.includes(req.user?.role || "")) {
            return next(new ErrorHandler(`Role ${req.user?.role} is not allow ed to access this resource`, 403))
        }
        next()
    }
}