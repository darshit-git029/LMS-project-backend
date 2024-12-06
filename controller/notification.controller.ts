import { CatchAsyncError } from "../middleware/catchAsyncError";
import NotificationModel from "../model/notification.model";
import ErrorHandler from "../Utils/ErrorHandler";
import { NextFunction, Request, Response } from "express";
import cron from "node-cron";

export const getNotification = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  console.log("....notification");

  try {
    const notification = await NotificationModel.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error: any) {
    console.log(error.message);

    return next(new ErrorHandler(error.message, 400));
  }
});

//update notification status only by admin

export const updateNotification = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await NotificationModel.findById(req.params.id);
    if (!notification) {
      return next(new ErrorHandler("Notification not found", 400));
    } else {
      notification.status ? (notification.status = "read") : "unread";
    }
    await notification.save();

    const notifications = await NotificationModel.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
});

//delete notificationn by - admin
cron.schedule("0 0 0 * * * ", async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await NotificationModel.deleteMany({ status: "read", createdAt: { $lt: thirtyDaysAgo } });
  console.log("Delete Read Notifications");
});
