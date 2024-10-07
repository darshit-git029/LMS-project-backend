import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../Utils/ErrorHandler";
import LayoutModel from "../model/layout.model";
import cloudeinary from "cloudinary"

//create layout

export const createLayout = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.body
        const isTypeExsit = await LayoutModel.findOne({type})
        if(isTypeExsit){
            return next(new ErrorHandler(`${type} is already exist`,400))
        }

        if (type === "Banner") {
            const { image, title, subTitle } = req.body
            const myCloude = await cloudeinary.v2.uploader.upload(image, {
                folder: "layout"
            })
            const banner = {
                image: {
                    public_id: myCloude.public_id,
                    url: myCloude.secure_url
                },
                title,
                subTitle
            }
            await LayoutModel.create(banner)
        }

        if (type === "FAQ") {
            const { faq } = req.body
            const FaqItem = await Promise.all(
                faq.map(async(item:any) => {
                    return{
                        question:item.question,
                        answer:item.answer
                    }
                })
            )
            await LayoutModel.create({type:"FAQ",faq:FaqItem})
        }

        if (type === "Categories") {
            const { category } = req.body
            const CategoriesItem = await Promise.all(
                category.map(async(item:any) => {
                    return{
                        title:item.title
                    }
                })
            )
            await LayoutModel.create({type:"Categories",category:CategoriesItem})
        }

        res.status(200).json({
            success: true,
            message: "Layout created successfully"
        })

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


//edit layout data

export const editLayout = CatchAsyncError(async(req:Request,res:Response,next:NextFunction) => {
    try {
        const { type } = req.body
       
        if (type === "Banner") {
            const bannerData:any = await LayoutModel.findOne({type:"Banner"})
            const { image, title, subTitle } = req.body
            if(bannerData){
                await cloudeinary.v2.uploader.destroy(bannerData.image.public_id)
            }
 
            const myCloude = await cloudeinary.v2.uploader.upload(image, {
                folder: "layout"
            })
            const banner = {
                image: {
                    public_id: myCloude.public_id,
                    url: myCloude.secure_url
                },
                title,
                subTitle
            }
            await LayoutModel.findByIdAndUpdate(bannerData.id,{banner})
        }

        if (type === "FAQ") {
            const { faq } = req.body
            const faqdata = await LayoutModel.findOne({type:"FAQ"})
            const FaqItem = await Promise.all(
                faq.map(async(item:any) => {
                    return{
                        question:item.question,
                        answer:item.answer
                    }
                })
            )
            await LayoutModel.findByIdAndUpdate(faqdata?._id,{type:"FAQ",faq:FaqItem})
        }

        if (type === "Categories") {
            const { category } = req.body
            const categorydata = await LayoutModel.findOne({type:"Categories"})

            const CategoriesItem = await Promise.all(
                category.map(async(item:any) => {
                    return{
                        title:item.title
                    }
                })
            )
            await LayoutModel.findByIdAndUpdate(categorydata?._id,{type:"Categories",category:CategoriesItem})
        }

        res.status(200).json({
            success: true,
            message: "Layout updated successfully"
        })


    } catch (error:any) {
        return next(new ErrorHandler(error.message,400))
    }
})



export const getLayoutByType = CatchAsyncError(async(req:Request,res:Response,next:NextFunction) => {
    try {
        const {type} = req.body
        const getLayout = await LayoutModel.find({type})
        res.status(200).json({
            success:true,
            getLayout
        })
    } catch (error:any) {
        return next(new ErrorHandler(error.message,400))
    }
})