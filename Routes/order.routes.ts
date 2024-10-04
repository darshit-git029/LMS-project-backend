import express from "express"
import { authoraiseRole, isAuthenticate } from "../middleware/auth"
import { createOrder, getAllOrderAdmin } from "../controller/order.controller"

const orderRouter = express.Router()

orderRouter.post("/create/order",isAuthenticate,createOrder)

//admin access

orderRouter.get("/get/order-admin",isAuthenticate,authoraiseRole("admin"),getAllOrderAdmin)

export default orderRouter;