import { Request, response, NextFunction, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../Utils/ErrorHandler";
import cloudinary from "cloudinary"
import { createCourse, getAllCourseService } from "../services/course.service";
import courseModel from "../model/course.model";
import { redis } from "../Utils/redis";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs"
import sendMail from "../Utils/SendMail";
import NotificationModel from "../model/notification.model";
import axios from "axios";
import { create } from "domain";


//create new course
export const uploadCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        const thubnail = data.thubnail;
        if (thubnail) {
            const myCloud = await cloudinary.v2.uploader.upload(thubnail, {
                folder: "courses",
            });

            data.thubnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        createCourse(data, res, next);
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})


// edit course
export const editCourse = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            console.log("update course api");

            const { data } = req.body;

            const thubnail = data.thubnail;

            const courseId = req.params.id;
            console.log(courseId);

            const courseData = await courseModel.findById(courseId) as any;

            // Check if thubnail is a string before using startsWith
            if (typeof thubnail === 'string' && thubnail && !thubnail.startsWith("https")) {
                await cloudinary.v2.uploader.destroy(courseData.thubnail.public_id);

                const myCloud = await cloudinary.v2.uploader.upload(thubnail, {
                    folder: "courses",
                });

                data.thubnail = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }

            if (typeof thubnail === 'string' && thubnail.startsWith("https")) {
                data.thubnail = {
                    public_id: courseData?.thubnail.public_id,
                    url: courseData?.thubnail.url,
                };
            }
            console.log("this is data", data);

            const course = await courseModel.findByIdAndUpdate(courseId, { $set: data }, { new: true });
            console.log("this is course data", course);

            res.status(201).json({
                success: true,
                course,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

//get single course without purchasing 
export const getSingleCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const courseId = req.params.id
        const course = await courseModel.findById(req.params.id).select("-courseData.videoUrl -courseData.suggeestion -courseData.questions -courseData.links").populate({
            path:"reviews.user",
            model:"User",
            select:"_id avatar name email createdAt"
        })
        res.status(200).json({
            success: true,
            message: "find course data by id",
            course
        })

    } catch (error: any) {
        console.log(error.message);
        return next(new ErrorHandler(error.message, 400))
    }
})


//get all course without purchasing 
export const getAllCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const course = await courseModel.find().select("-courseData.videoUrl -courseData.suggeestion -courseData.questions -courseData.links").populate({
            path:"reviews.user",
            model:"User",
            select:"_id avatar name email createdAt"
        })  

        res.status(200).json({
            success: true,
            message: "All course data",
            course
        })


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

        const course = await courseModel.findById(courseId).populate({
            path:"courseData.questions.user",
            model:"User",
            select:"_id avatar name createdAt"
        }).exec()
        
        const content = course?.courseData 
        const time = {createdAt : new Date().toISOString()}

        res.status(200).json({
            success: true,
            content,
            time,
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
        let course = await courseModel.findById(courseId)

        if (!mongoose.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("Invalid content id.", 400))
        }
        const courseContent = course?.courseData?.find((item: any) => item._id.equals(contentId))

        if (!courseContent) {
            return next(new ErrorHandler("Invalid course content.", 400))
        }

        const newQuestion: any = {
            user: req.user._id,
            question,
            questionReplies: [],
            createdAt: new Date().toISOString(),
            updatedAt : new Date().toISOString(),
        }
        
        courseContent.questions.push(newQuestion)

        await NotificationModel.create({
            user: req.user._id,
            title: "New Qoestion",
            message: `You have new question from ${courseContent.title}`
        })

        await course?.save()

        course = await courseModel.findById(courseId).populate({
            path:"courseData.questions.user",
            model:"User",
            select:"_id avatar name createdAt"
        }).exec()


        res.status(200).json({
            success: true,
            course,
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

        let course = await courseModel.findById(courseId)

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
            answer,
            createdAt: new Date().toISOString(),
            updatedAt : new Date().toISOString()
        }

        question.questionReplies.push(newAnswer)


        await course?.save()

        course = await courseModel.findById(courseId).populate({
            path:"courseData.questions.questionReplies.user",
            model:"User",
            select:"_id avatar name email createdAt"
        }).exec()

        if (req.user?._id === question.user._id) {
            //create notification
            await NotificationModel.create({
                user: req.user?._id,
                title: "New Qoestion Replay Recevied",
                message: `You have new question reply in ${courseContent.title}`,
                email:`from ${user.email}`
            })
        } else {
            
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

        let course = await courseModel.findById(courseId)
        const { review, rating } = req.body as IAddreview

        const newReview: any = {
            user: req.user._id,
            comment: review,
            rating: rating,
            createdAt:new Date().toISOString()
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

        course = await courseModel.findById(courseId).populate({
            path:"reviews.user",
            model:"User",
            select:"_id avatar name email createdAt"
        }).exec()
            

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
            comment,
            createdAt: new Date().toISOString(),
            updatedAt : new Date().toISOString()
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