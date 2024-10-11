import express from "express"
import { authoraiseRole, isAuthenticate } from "../middleware/auth"
import { getCourseAnalytics, getOrderAnalytics, getUserAnalytics } from "../controller/analytics.controller"
import { updateAccessToken } from "../controller/user.controller"

const analyticsRouter = express.Router()

analyticsRouter.get("/get-user-analytics",updateAccessToken, isAuthenticate,authoraiseRole("admin"),getUserAnalytics)

analyticsRouter.get("/get-course-analytics",updateAccessToken, isAuthenticate,authoraiseRole("admin"),getCourseAnalytics)

analyticsRouter.get("/get-order-analytics",updateAccessToken, isAuthenticate,authoraiseRole("admin"),getOrderAnalytics)

export default analyticsRouter