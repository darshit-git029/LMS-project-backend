import express from "express";
import { authoraiseRole, isAuthenticate } from "../middleware/auth";
import { createOrder, getAllOrderAdmin, newPayment, publishStripeKey } from "../controller/order.controller";
import { updateAccessToken } from "../controller/user.controller";

const orderRouter = express.Router();

orderRouter.post("/create/order", updateAccessToken, isAuthenticate, createOrder);

orderRouter.get("/payment/publishStripeKey", publishStripeKey);

orderRouter.post("/payment", isAuthenticate, newPayment);

//admin access

orderRouter.get("/get/order-admin", updateAccessToken, isAuthenticate, authoraiseRole("admin"), getAllOrderAdmin);

export default orderRouter;
