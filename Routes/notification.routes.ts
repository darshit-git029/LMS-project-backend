import express from "express"
import { authoraiseRole, isAuthenticate } from "../middleware/auth"
import { getNotification, updateNotification } from "../controller/notification.controller";


const notificationRoute = express.Router()

notificationRoute.get("/get/notification",isAuthenticate,authoraiseRole("admin"),getNotification)

notificationRoute.put("/update/notification/:id",isAuthenticate,authoraiseRole("admin"),updateNotification)

export default notificationRoute;