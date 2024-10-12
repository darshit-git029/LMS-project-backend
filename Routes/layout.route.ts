import express from "express"
import { authoraiseRole, isAuthenticate } from "../middleware/auth"
import { createLayout, editLayout, getLayoutByType } from "../controller/layout.controller"
import { updateAccessToken } from "../controller/user.controller"

const layoutRouter = express.Router()

layoutRouter.post("/create/layout",updateAccessToken,isAuthenticate,authoraiseRole("admin"),createLayout)
layoutRouter.put("/edit/layout",updateAccessToken,isAuthenticate,authoraiseRole("admin"),editLayout)
layoutRouter.get("/get/layout/:type",updateAccessToken,isAuthenticate,authoraiseRole("admin"),getLayoutByType)

export default layoutRouter