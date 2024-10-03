import  express  from "express";
import { authoraiseRole, isAuthenticate } from "../middleware/auth";
import { editCourse, getAllCourse, getSingleCourse, uploadCourse } from "../controller/course.controller";

const courseRouter = express.Router()

courseRouter.post("/create/course",isAuthenticate,authoraiseRole("admin"),uploadCourse)

courseRouter.put("/edit/course/:id",isAuthenticate,authoraiseRole("admin"),editCourse)

courseRouter.get('/get/course/:id',getSingleCourse)

courseRouter.get('/get/all/course/',getAllCourse)


export default courseRouter;