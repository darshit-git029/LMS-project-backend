import { Request, response, NextFunction, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../Utils/ErrorHandler";
import cloudeinary from "cloudinary"
import { createCourse, getAllCourseService } from "../services/course.service";
import courseModel from "../model/course.model";
import { redis } from "../Utils/redis";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs"
import sendMail from "../Utils/SendMail";
import NotificationModel from "../model/notification.model";
import axios from "axios";


//create new course
export const uploadCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    console.log("........Create Course API.........");

    try {
        const data = req.body
        const thubnail = data.thubnail
        if (thubnail) {
            const myCloude = cloudeinary.v2.uploader.upload(thubnail, {
                folder: "course"
            })
            data.thubnail = {
                public_id: (await myCloude).public_id
            }
        }
        createCourse(data, res, next)

    } catch (error: any) {
        console.log(error.message);
        return next(new ErrorHandler(error.message, 400))
    }
})


//edit existing course

export const editCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    console.log("........Edit Course API.........");

    try {
        const data = req.body
        const thubnail = data.thubnail
        if (thubnail) {
            await cloudeinary.v2.uploader.destroy(thubnail.public_id)

            const myCloude = await cloudeinary.v2.uploader.upload(thubnail, {
                folder: "course"
            })
            data.thubnail = {
                public_id: myCloude.public_id,
                url: myCloude.secure_url
            }
        }

        const courseId = req.params.id
        const course = await courseModel.findByIdAndUpdate(courseId, {
            $set: data
        }, { new: true },
        )

        res.status(200).json({
            success: true,
            message: "Course Updated successfully.",
            course
        })


    } catch (error: any) {
        console.log(error.message);
        return next(new ErrorHandler(error.message, 400))
    }
})

//get single course without purchasing 
export const getSingleCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const courseId = req.params.id

        const isCacheExist = await redis.get(courseId)

        if (isCacheExist) {
            const course = JSON.parse(isCacheExist)
            res.status(200).json({
                success: true,
                course
            })
        } else {
            const course = await courseModel.findById(req.params.id).select("-courseData.videoUrl -courseData.suggeestion -courseData.questions -courseData.links")
            await redis.set(courseId, JSON.stringify(course), "EX", 604800)
            res.status(200).json({
                success: true,
                message: "find course data by id",
                course
            })
        }





    } catch (error: any) {
        console.log(error.message);
        return next(new ErrorHandler(error.message, 400))
    }
})


//get all course without purchasing 
export const getAllCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const isCacheExist = await redis.get("allCourses")

        if (isCacheExist) {
            const course = JSON.parse(isCacheExist)
            res.status(200).json({
                success: true,
                course
            })
        } else {

            const course = await courseModel.find().select("-courseData.videoUrl -courseData.suggeestion -courseData.questions -courseData.links")
            await redis.set("allCourses", JSON.stringify(course))

            res.status(200).json({
                success: true,
                message: "All course data",
                course
            })

        }

    } catch (error: any) {
        console.log(error.message);
        return next(new ErrorHandler(error.message, 400))
    }
})


//get course for only valid user

export const getCourseByUSer = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    console.log("......get course by valid user.......");
    try {

        const userCourseList = req.user?.courses
        const courseId = req.params.id

        const courseExist = userCourseList?.find((course: any) => courseId.toString() === courseId)
        if (!courseExist) {
            return next(new ErrorHandler("You are not eligible to access this course", 400))
        }

        const course = await courseModel.findById(courseId)
        const content = course?.courseData

        res.status(200).json({
            success: true,
            content
        })

    } catch (error: any) {
        console.log(error.message);
        return next(new ErrorHandler(error.message, 400))
    }
})

//add question in course

interface IAddQuestionData {
    question: string
    courseId: string
    contentId: string
}

export const addQuestion = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    console.log("......Add Question is course.......");
    try {
        const { question, courseId, contentId }: IAddQuestionData = req.body
        const course = await courseModel.findById(courseId)

        if (!mongoose.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("Invalid content id.", 400))
        }
        const courseContent = course?.courseData?.find((item: any) => item._id.equals(contentId))

        if (!courseContent) {
            return next(new ErrorHandler("Invalid course content.", 400))
        }

        const newQuestion: any = {
            user: req.user,
            question,
            questionReplies: []
        }

        courseContent.questions.push(newQuestion)

        await NotificationModel.create({
            user: req.user?._id,
            title: "New Qoestion",
            message: `You have new question from ${courseContent.title}`
        })

        await course?.save()

        res.status(200).json({
            success: true,
            course
        })


    } catch (error: any) {
        console.log(error.message);
        return next(new ErrorHandler(error.message, 400))
    }
})

//add questionreplies 

interface IAddAnswerData {
    answer: string
    courseId: string
    contentId: string
    questionId: string
}


export const addAnswer = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    console.log("....Add answer.....");

    try {
        const { answer, courseId, contentId, questionId }: IAddAnswerData = req.body

        const course = await courseModel.findById(courseId)

        if (!mongoose.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("Invalid content id.", 400))
        }

        const courseContent = course?.courseData?.find((item: any) => item._id.equals(contentId))
        if (!courseContent) {
            return next(new ErrorHandler("Invalid course content.", 400))
        }

        const question = courseContent?.questions?.find((item: any) =>
            item._id.equals(questionId)
        )

        if (!question) {
            return next(new ErrorHandler("Invalid question id.", 400))
        }

        const newAnswer: any = {
            user: req.user,
            answer
        }

        question.questionReplies.push(newAnswer)


        await course?.save()

        if (req.user?._id === question.user._id) {
            //create notification
            await NotificationModel.create({
                user: req.user?._id,
                title: "New Qoestion Replay Recevied",
                message: `You have new question reply in ${courseContent.title}`
            })
        } else {
            const data = {
                name: question.user.name,
                title: courseContent.title
            }

            const html = await ejs.renderFile(path.join(__dirname, "../Mails/question-replies.ejs"), data)
            try {
                await sendMail({
                    email: question.user.email,
                    subject: "Question Relpy ",
                    template: "question-replies.ejs",
                    data
                })

            } catch (error: any) {
                console.log(error.message);
                return (new ErrorHandler(error.message, 400))
            }

        }

        res.status(200).json({
            success: true,
            course
        })

    } catch (error: any) {
        console.log(error.message);
        return next(new ErrorHandler(error.message, 400))
    }
})

//add review in course

interface IAddreview {
    review: string
    courseId: string
    rating: string
    userId: string
}


export const addReview = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("....review....");
        const userCourseList = req.user?.courses
        const courseId = req.params.id

        const ExistCourseId = userCourseList?.find((course: any) => courseId.toString() === courseId)
        if (!ExistCourseId) {
            return next(new ErrorHandler("You are not eligible to access this", 400))
        }

        const course = await courseModel.findById(courseId)
        const { review, rating } = req.body as IAddreview

        const newReview: any = {
            user: req.user,
            comment: review,
            rating: rating
        }
        course?.reviews?.push(newReview)

        let avg = 0
        course?.reviews.forEach((rev: any) => {
            avg += rev.rating
        })

        if (course) {
            course.rating = avg / course.reviews.length //review/rating  
        }

        await course?.save()

        const notification = {
            titleL: "New Review",
            message: `${req.user.name} has given a review in ${course?.name} `
        }

        //create notification

        res.status(200).json({
            success: true,
            course
        })

    } catch (error: any) {
        console.log(error.message);
        return next(new ErrorHandler(error.message, 400))
    }
})


//add reply to review only admin cen reply the review

interface IAddReviewData {
    comment: string
    courseId: string
    reviewId: string
}

export const addReplyToReview = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    console.log("....Add replay to review.....");
    try {
        const { comment, courseId, reviewId }: IAddReviewData = req.body

        const course = await courseModel.findById(courseId)

        if (!course) {
            return next(new ErrorHandler("Course not found", 400))
        }

        const review = course?.reviews?.find((rev: any) => rev._id.toString() === reviewId)

        if (!review) {
            return next(new ErrorHandler("Review not found", 400))
        }
        const replyData: any = {
            user: req.user,
            comment
        }

        if (!review.commentReplies) {
            review.commentReplies = []
        }

        review?.commentReplies?.push(replyData)
        await course.save()
        res.status(200).json({
            success: true,
            course
        })


    } catch (error: any) {
        console.log(error.message);
        return next(new ErrorHandler(error.message, 400))
    }

})


//get all course only for admin

export const getAllCourseAdmin = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        getAllCourseService(req, res, next)

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


//delete course -- admin

export const deleteCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params

        const course = await courseModel.findById(id)
        if (!course) {
            return next(new ErrorHandler("course not found!", 400))
        }

        await course.deleteOne({ id })

        await redis.del(id)

        res.status(200).json({
            success: true,
            message: "course deleted successfully"
        })
    } catch (error: any) {
        return next((new ErrorHandler(error.Message, 400)))
    }
})


//generate vedio url using vediocipherh
export const generateVedioUrl = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { videoId } = req.body
        const response = await axios.post(
            `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
            { ttl: 300 },
            {
                headers: {
                    Accept: "application/json",
                    'Content-Type': "application/json",
                    Authorization: `Apisecret ${process.env.VEDIO_API_SECRET}`
                }
            }
        )
        res.json(response.data)
        
    } catch (error: any) {
        console.log(error);
        
        return next((new ErrorHandler(error.Message, 400)))
    }
})