import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../Utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import usermodel, { IUser } from "../model/user.model";
import jwt, { Secret } from "jsonwebtoken"
import dotenv from "dotenv"
import ejs from "ejs"
import path from "path";
import sendMail from "../Utils/SendMail";
dotenv.config()
//register user

interface IRegistrationBody {
    name: string
    email: string
    password: string
    avatar?: string
}

export const registrationUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body

        const isEmailExist = await usermodel.findOne({ email })
        if (isEmailExist) {
            return next(new ErrorHandler("email is already exist.", 400))
        }

        const user: IRegistrationBody = {
            name, email, password
        }

        const activationToken = createActivationToken(user)
        const activationcode = activationToken.activationcode

        const data = {user:{name:user.name},activationcode}
        const html = await ejs.renderFile(path.join(__dirname,"../Mails/email-activationcode.ejs"),data)

        try {
            await sendMail({
                email:user.email,
                subject:"Activate Your LMS Account",
                template:"email-activationcode.ejs",
                data
            })
            res.status(200).json({
                success:true,
                message:`Please check youe email ${user.email} for varification code `,
                activationToken : activationToken.token
            })
        } catch (error:any) {
            console.log(error.message);
            
            return (new ErrorHandler(error.message,400))
        }

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})

interface IActivationToken{
    token:string
    activationcode:string
}

export const createActivationToken = (user:any):IActivationToken => {
    const activationcode = Math.floor(1000 + Math.random() * 9000).toString()
    const token = jwt.sign({user,activationcode},process.env.ACTIVACTION_SECRET as Secret ,{expiresIn:"24h"})
    return {token,activationcode}
}


//activate user
interface IActivationRequest{
    activation_token:string
    activation_code:string
}

export const activateUser = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
     try {
        const {activation_token,activation_code} = req.body as IActivationRequest;

        const newUser: {user:IUser;activationcode:string} = jwt.verify(activation_token,process.env.ACTIVACTION_SECRET as string) as {user:IUser;activationcode:string}

        if(newUser.activationcode != activation_code){
        return next(new ErrorHandler("Invaild activation code", 400))
        }
        const{name,email,password} = newUser.user

        const existUser = await usermodel.findOne({email})

        if(existUser){
        return next(new ErrorHandler("user already exits", 400))
        }

        const user = await usermodel.create({
            name,email,password
        })

        res.status(200).json({
            success:true
        })

     } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})