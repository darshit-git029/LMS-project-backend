import express from "express"
import { authoraiseRole, isAuthenticate } from "../middleware/auth"
import { getCourseAnalytics, getOrderAnalytics, getUserAnalytics } from "../controller/analytics.controller"

const analyticsRouter = express.Router()

analyticsRouter.get("/get-user-analytics", isAuthenticate,authoraiseRole("admin"),getUserAnalytics)

analyticsRouter.get("/get-course-analytics", isAuthenticate,authoraiseRole("admin"),getCourseAnalytics)

analyticsRouter.get("/get-order-analytics", isAuthenticate,authoraiseRole("admin"),getOrderAnalytics)

export default analyticsRouter