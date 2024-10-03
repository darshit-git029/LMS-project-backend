import { Request, response, NextFunction, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../Utils/ErrorHandler";
import cloudeinary from "cloudinary"
import { createCourse } from "../services/course.service";
import { url } from "inspector";
import courseModel from "../model/course.model";
import { redis } from "../Utils/redis";
import { isErrored } from "stream";


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
            await redis.set(courseId, JSON.stringify(course))
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
