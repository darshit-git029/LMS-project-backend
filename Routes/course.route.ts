import express from "express";
import { authoraiseRole, isAuthenticate } from "../middleware/auth";
import {
  addAnswer,
  addQuestion,
  addReplyToReview,
  addReview,
  deleteCourse,
  editCourse,
  generateVedioUrl,
  getAllCourse,
  getAllCourseAdmin,
  getCourseByUSer,
  getSingleCourse,
  uploadCourse,
} from "../controller/course.controller";
import { isatty } from "tty";
import { generateKey } from "crypto";
import { updateAccessToken } from "../controller/user.controller";

const courseRouter = express.Router();

courseRouter.post("/create/course", updateAccessToken, isAuthenticate, authoraiseRole("admin"), uploadCourse);

courseRouter.put("/edit/course/:id", updateAccessToken, isAuthenticate, authoraiseRole("admin"), editCourse);

courseRouter.get("/get/course/:id", getSingleCourse);

courseRouter.get("/get/all/course", getAllCourse);

courseRouter.get("/get/course/content/:id", updateAccessToken, isAuthenticate, getCourseByUSer);

courseRouter.put("/add/question", updateAccessToken, isAuthenticate, addQuestion);

courseRouter.put("/add/answer", updateAccessToken, isAuthenticate, addAnswer);

courseRouter.put("/add/review/:id", updateAccessToken, isAuthenticate, addReview);

courseRouter.put("/reply", updateAccessToken, isAuthenticate, authoraiseRole("admin"), addReplyToReview);

courseRouter.post("/getVdoCipherOTP", generateVedioUrl);

//admin access
courseRouter.get("/get/course-admin", updateAccessToken, isAuthenticate, authoraiseRole("admin"), getAllCourseAdmin);

courseRouter.delete("/delete/course/:id", updateAccessToken, isAuthenticate, authoraiseRole("admin"), deleteCourse);
export default courseRouter;
