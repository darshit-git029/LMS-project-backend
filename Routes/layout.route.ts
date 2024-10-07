import express from "express"
import { authoraiseRole, isAuthenticate } from "../middleware/auth"
import { createLayout, editLayout, getLayoutByType } from "../controller/layout.controller"

const layoutRouter = express.Router()

layoutRouter.post("/create/layout",isAuthenticate,authoraiseRole("admin"),createLayout)
layoutRouter.put("/edit/layout",isAuthenticate,authoraiseRole("admin"),editLayout)
layoutRouter.get("/get/layout",isAuthenticate,authoraiseRole("admin"),getLayoutByType)

export default layoutRouter