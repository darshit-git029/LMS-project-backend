import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../Utils/ErrorHandler";
import orderModel from "../model/order.model";
import { IOrder } from "../model/order.model";
import usermodel from "../model/user.model";
import courseModel from "../model/course.model";
import path from "path";
import dotenv from "dotenv"
import ejs, { name } from "ejs"
import sendMail from "../Utils/SendMail";
import notificationModel from "../model/notification.model";
import { NextFunction, Request, Response } from "express";
import { IUser } from "../model/user.model";
import { getAllOrderservice, newOrder } from "../services/order.service";
import { log } from "console";
dotenv.config()


export const createOrder = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        
        console.log("....order/\.....")
        const { courseId, payment_info } = req.body as IOrder
        
        const user = await usermodel.findById(req.user?._id)
        
        const courseExistInuser = user?.courses.some((course: any) => course._id.toString() === courseId)

        if (courseExistInuser) {
            return next(new ErrorHandler("you are already purchased this course", 400))
        }

        const course = await courseModel.findById(courseId)

        if (!course) {
            return next(new ErrorHandler("Course not founde", 400))
        }

        const data: any = {
            courseId: course._id,
            userId: req.user?._id,
            payment_info,
        }        
        const maildata = {
            order: {
                _id :course?._id.toString(),
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
            }
            
        }
        const html = await ejs.renderFile(path.join(__dirname, "../Mails/order.ejs"), { order: maildata })
        try {

            if (user) {
                await sendMail({
                    email: user.email,
                    subject: "Order Conformation",
                    template: "order.ejs",
                    data: maildata
                })
            }

        } catch (error: any) {
            console.log(error.message);
            return (new ErrorHandler(error.message, 400))
        }

        user?.courses.push(course?._id)

        console.log(course.purchased);
        course.purchased  ? course.purchased += 1: course.purchased
        console.log(course.purchased);

        await user.save()

        await notificationModel.create({
            user: user?._id,
            title: "New Order",
            message: `You have new order from ${course.name}`
        })

        newOrder(data, res, next)


    } catch (error: any) {
        console.log(error);
        
        return next(new ErrorHandler(error.message, 4000))
    }
})


//get all order only admin 
export const getAllOrderAdmin = CatchAsyncError(async(req:Request,res:Response,next:NextFunction) => {
    try {
        getAllOrderservice(req,res,next)

    } catch (error:any) {
        return next(new ErrorHandler(error.message,400))
    }
})