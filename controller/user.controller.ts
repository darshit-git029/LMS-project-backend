import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../Utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import usermodel, { IUser } from "../model/user.model";
import jwt, { JwtPayload, Secret } from "jsonwebtoken"
import dotenv from "dotenv"
import ejs from "ejs"
import path from "path";
import sendMail from "../Utils/SendMail";
import { accessTokenOption, refreshTokenOption, sendToken } from "../Utils/jwt";
import { redis } from "../Utils/redis";
import { json } from "stream/consumers";
import { getUserById } from "../services/user.service";
import cloudeinary from "cloudinary"
import { mkdirSync } from "fs";
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

        const data = { user: { name: user.name }, activationcode }
        const html = await ejs.renderFile(path.join(__dirname, "../Mails/email-activationcode.ejs"), data)

        try {
            await sendMail({
                email: user.email,
                subject: "Activate Your LMS Account",
                template: "email-activationcode.ejs",
                data
            })
            res.status(200).json({
                success: true,
                message: `Please check youe email ${user.email} for varification code `,
                activationToken: activationToken.token
            })
        } catch (error: any) {
            console.log(error.message);

            return (new ErrorHandler(error.message, 400))
        }

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})

interface IActivationToken {
    token: string
    activationcode: string
}

export const createActivationToken = (user: any): IActivationToken => {
    const activationcode = Math.floor(1000 + Math.random() * 9000).toString()
    const token = jwt.sign({ user, activationcode }, process.env.ACTIVACTION_SECRET as Secret, { expiresIn: "24h" })
    return { token, activationcode }
}


//activate user
interface IActivationRequest {
    activation_token: string
    activation_code: string
}

export const activateUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { activation_token, activation_code } = req.body as IActivationRequest;

        const newUser: { user: IUser; activationcode: string } = jwt.verify(activation_token, process.env.ACTIVACTION_SECRET as string) as { user: IUser; activationcode: string }

        if (newUser.activationcode != activation_code) {
            return next(new ErrorHandler("Invaild activation code", 400))
        }
        const { name, email, password } = newUser.user

        const existUser = await usermodel.findOne({ email })

        if (existUser) {
            return next(new ErrorHandler("user already exits", 400))
        }

        const user = await usermodel.create({
            name, email, password
        })

        res.status(200).json({
            success: true
        })

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})

//Login user
interface ILoginBody {
    email: string
    password: string
}

export const userLogin = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { email, password } = req.body as ILoginBody

        if (!email || !password) {
            return next(new ErrorHandler("Please enter email and password", 400))
        }

        const user = await usermodel.findOne({ email }).select("+password")

        if (!user) {
            return res.status(401).json({ error: true, message: "Invalid email or password" });
        }

        const isPasswordMatch = await user.commparePassword(password);

        if (!isPasswordMatch) {
            return next(new ErrorHandler("Invalid Password, try again", 400))
        }
        sendToken(user, 200, res)


    } catch (error: any) {
        console.log(error.message);

        return next(new ErrorHandler(error.message, 400))

    }
})

//Logout User

export const userLogout = CatchAsyncError(async (req: Response, res: Response, next: NextFunction) => {
    try {

        res.cookie("access_token", "", { maxAge: 1 })
        res.cookie("refresh_token", "", { maxAge: 1 })
        const userId = req.user?._id;

        redis.del(userId); // Ensure userId is a string


        res.status(200).json({
            success: true,
            message: "Logout successfully."
        })

    } catch (error: any) {
        console.log(error.message);
        return next(new ErrorHandler(error.message, 400))
    }
})

//update access token

export const updateAccessToken = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refresh_token = req.cookies.refresh_token as string;

        const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload

        const message = "Could not refresh token"
        if (!decoded) {
            return next(new ErrorHandler(message, 400))
        }

        const session = await redis.get(decoded.id as string)
        if (!session) {
            return next(new ErrorHandler(message, 400))
        }

        const user = JSON.parse(session)

        const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN as string, { expiresIn: "15" })
        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN as string, { expiresIn: "3d" })
        req.user = user
        res.cookie("access_token", accessToken, accessTokenOption)
        res.cookie("refresh_token", refresh_token, refreshTokenOption)
        res.status(200).json({
            success: true,
            accessToken
        })

    } catch (error: any) {
        console.log(error.message);
        return next(new ErrorHandler(error.message, 400))
    }
})


//get user information

export const getUserInfo = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        getUserById(userId, res)
    } catch (error: any) {
        console.log(error.message);
        return next(new ErrorHandler(error.message, 400))
    }
})

//social auth

interface ISocialauthbody {
    email: string
    name: string
    avatar: string
}

export const socialAuth = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { email, name, avatar } = req.body as ISocialauthbody

        const user = await usermodel.findOne({ email })
        if (!user) {
            const newUser = await usermodel.create({ email, name, avatar })
            sendToken(newUser, 200, res)
        } else {
            sendToken(user, 200, res)
        }

    } catch (error: any) {
        console.log(error.message);
        return next(new ErrorHandler(error.message, 400))
    }
})

//update userinfo

interface IUpdateUserInfo {
    name: string
    email: string
}

export const updateUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { name, email } = req.body as IUpdateUserInfo
        const userId = req.user?._id
        const user = await usermodel.findById(userId)

        if (email && user) {
            const isEmailExist = await usermodel.findOne({ email })
            if (isEmailExist) {
                return next(new ErrorHandler("email is already exist.", 400))
            }
            user.email = email
        }

        if (name && user) {
            user.name = name
        }

        await user?.save()

        await redis.set(userId, JSON.stringify(user))

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user
        })

    } catch (error: any) {
        console.log(error.message);
        return next(new ErrorHandler(error.message, 400))
    }
})


//update user password

interface IUpdatePassword {
    oldpassword: string
    newpassword: string
}

export const updatePassword = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { oldpassword, newpassword } = req.body as IUpdatePassword

        const user = await usermodel.findById(req.user?._id).select("+password")

        if (user?.password === undefined) {
            return next(new ErrorHandler("Invalid user!", 400))

        }
        const isPasswordMatch = await user?.commparePassword(oldpassword)
        if (!isPasswordMatch) {
            return next(new ErrorHandler("Invalid your old password!", 400))
        }
        user.password = newpassword
        await user?.save()

        await redis.set(req.user?._id, JSON.stringify(user))

        res.status(200).json({
            success: true,
            message: "Password updated successfully"
        })
    } catch (error: any) {
        console.log(error.message);
        return next(new ErrorHandler(error.message, 400))
    }
})

//update user profile image

interface IUpdateProfilePhoto {
    avatar: string
}

export const updateProfilePhoto = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { avatar } = req.body

        const userId = req.user?._id
        const user = await usermodel.findById(userId)

        if (avatar && user) {
            //if user have avatar then call this if
            if (user?.avatar?.public_id) {
                //first delete the old avatar
                await cloudeinary.v2.uploader.destroy(user?.avatar?.public_id)

                //update new avatar
                const myCloude = await cloudeinary.v2.uploader.upload(avatar, { folder: "avatars" })
                user.avatar = {
                    public_id: myCloude.public_id,
                    url: myCloude.secure_url
                }
            } else {
                //if user have not avatar then add the avatar
                const myCloude = await cloudeinary.v2.uploader.upload(avatar, { folder: "avatars" })
                user.avatar = {
                    public_id: myCloude.public_id,
                    url: myCloude.secure_url
                }
            }

        }
        await user?.save()
        await redis.set(userId, JSON.stringify(user))
        res.status(200).json({
            success:true,
            message:"Profile picture updated successfully.",
            user
        })
    } catch (error: any) {
        console.log(error.message);
        return next(new ErrorHandler(error.message, 400))
    }
})