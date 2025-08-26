import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../Utils/ErrorHandler";
import { IOrder } from "../model/order.model";
import usermodel from "../model/user.model";
import courseModel, { ICourse } from "../model/course.model";
import path from "path";
import dotenv from "dotenv";
import ejs, { name } from "ejs";
import notificationModel from "../model/notification.model";
import { NextFunction, Request, Response } from "express";
import { getAllOrderservice, newOrder } from "../services/order.service";
import sendMail from "../Utils/SendMail";
dotenv.config();

// import stripe from "stripe"
const stripe = require("stripe")(process.env.PUBLICK_SCERET_KEY);

export const createOrder = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("....order/.....");
    const { courseId, payment_info } = req.body as IOrder;
    if ("id" in payment_info) {
      const paymentIntentId = payment_info.id;
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== "succeeded") {
        return next(new ErrorHandler("Payment is not authorize", 400));
      }
    }

    const user = await usermodel.findById(req.user?._id);

    const courseExistInuser = user?.courses.some((course: any) => course._id.toString() === courseId);

    if (courseExistInuser) {
      return next(new ErrorHandler("you are already purchased this course", 400));
    }

    const course: ICourse | null = await courseModel.findById(courseId);
    if (!course) {
      return next(new ErrorHandler("Course not founde", 400));
    }

    const data: any = {
      courseId: course._id,
      userId: req.user?._id,
      payment_info,
    };
    const maildata = {
      order: {
        _id: course?.id.toString(),
        name: course.name,
        price: course.price,
        date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      },
    };
    const html = await ejs.renderFile(path.join(__dirname, "../Mails/order.ejs"), { order: maildata });
    try {
      if (user) {
        await sendMail({
          email: user.email,
          subject: "Order Conformation",
          template: "order.ejs",
          data: maildata,
        });
      }
    } catch (error: any) {
      console.log(error.message);
      return new ErrorHandler(error.message, 400);
    }

    if (user && Array.isArray(user.courses)) {
      user.courses.push({ courseId: (course._id as string).toString() });
    }

    course.purchased = course.purchased + 1;
    await course.save();

    await user?.save();

    await notificationModel.create({
      user: user?._id,
      title: "New Order",
      message: `You have new order from ${course.name}`,
    });

    newOrder(data, res, next);
  } catch (error: any) {
    console.log(error.message);
    console.log("this is order controller");
    return next(new ErrorHandler(error.message, 4000));
  }
});

//get all order only admin
export const getAllOrderAdmin = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    getAllOrderservice(req, res, next);
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
});

//send stripe publish key

export const publishStripeKey = CatchAsyncError(async (req: Request, res: Response) => {
  res.status(200).json({
    publishableKey: process.env.PUBLISH_KEY,
  });
});

// update payment status -- admin

export const newPayment = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const myPayment = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "USD",
      metadata: {
        company: "E-learning",
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      success: true,
      client_secret: myPayment.client_secret,
    });
  } catch (error: any) {
    console.log(error);

    return next(new ErrorHandler(error.message, 400));
  }
});
