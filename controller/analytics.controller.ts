import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../Utils/ErrorHandler";
import { generateLast12MonthData } from "../Utils/analytics.generate";
import usermodel from "../model/user.model";
import courseModel from "../model/course.model";
import orderModel from "../model/order.model";

// get user analytics -- only admin

export const getUserAnalytics = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await generateLast12MonthData(usermodel);
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// get course analytics -- only admin

export const getCourseAnalytics = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await generateLast12MonthData(courseModel);
    res.status(200).json({
      success: true,
      course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// get order analytics -- only admin

export const getOrderAnalytics = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await generateLast12MonthData(orderModel);
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
});
