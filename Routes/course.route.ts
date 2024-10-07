import  express  from "express";
import { authoraiseRole, isAuthenticate } from "../middleware/auth";
import { addAnswer, addQuestion, addReplyToReview, addReview, deleteCourse, editCourse, getAllCourse, getAllCourseAdmin, getCourseByUSer, getSingleCourse, uploadCourse } from "../controller/course.controller";
import { isatty } from "tty";

const courseRouter = express.Router()

courseRouter.post("/create/course",isAuthenticate,authoraiseRole("admin"),uploadCourse)

courseRouter.put("/edit/course/:id",isAuthenticate,authoraiseRole("admin"),editCourse)

courseRouter.get('/get/course/:id',getSingleCourse)

courseRouter.get('/get/all/course/',getAllCourse)

courseRouter.get('/get/course/content/:id',isAuthenticate,getCourseByUSer)

courseRouter.put('/add/question',isAuthenticate,addQuestion)

courseRouter.put('/add/answer',isAuthenticate,addAnswer)

courseRouter.put("/add/review/:id",isAuthenticate,addReview)

courseRouter.put("/reply",isAuthenticate,authoraiseRole("admin"),addReplyToReview)

//admin access
 courseRouter.get("/get/course-admin",isAuthenticate,authoraiseRole("admin"),getAllCourseAdmin)

 courseRouter.delete("/delete/course/:id",isAuthenticate,authoraiseRole("admin"),deleteCourse)
export default courseRouter;