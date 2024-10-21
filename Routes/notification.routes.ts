import express from "express";
import { authoraiseRole, isAuthenticate } from "../middleware/auth";
import { getNotification, updateNotification } from "../controller/notification.controller";
import { updateAccessToken } from "../controller/user.controller";

const notificationRoute = express.Router();

notificationRoute.get("/get/notification", updateAccessToken, isAuthenticate, authoraiseRole("admin"), getNotification);

notificationRoute.put(
  "/update/notification/:id",
  updateAccessToken,
  isAuthenticate,
  authoraiseRole("admin"),
  updateNotification,
);

export default notificationRoute;
