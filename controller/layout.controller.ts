import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../Utils/ErrorHandler";
import LayoutModel from "../model/layout.model";
import cloudeinary from "cloudinary"

//create layout

export const createLayout = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    enum LayoutType {
        BANNER = 'banner',
        FAQ = 'FAQ',
        CATEGORY = 'Categories'
    }

    try {
        const { type } = req.body
        const isTypeExsit = await LayoutModel.findOne({ type })
        if (isTypeExsit) {
            return next(new ErrorHandler(`${type} is already exist`, 400))
        }

        if (type === LayoutType.BANNER) {
            const { image, title, subTitle } = req.body
            const myCloude = await cloudeinary.v2.uploader.upload(image, {
                folder: "layout"
            })
            const banner = {
                type: LayoutType.BANNER,
                banner: {

                    image: {
                        public_id: myCloude.public_id,
                        url: myCloude.secure_url
                    }
                },
                title,
                subTitle
            }
            await LayoutModel.create(banner)
        }

        if (type === LayoutType.FAQ) {
            const { faq } = req.body
            const FaqItem = await Promise.all(
                faq.map(async (item: any) => {
                    return {
                        question: item.question,
                        answer: item.answer
                    }
                })
            )
            await LayoutModel.create({ type: LayoutType.FAQ, faq: FaqItem })
        }

        if (type === LayoutType.CATEGORY) {
            const { category } = req.body
            const CategoriesItem = await Promise.all(
                category.map(async (item: any) => {
                    return {
                        title: item.title
                    }
                })
            )
            await LayoutModel.create({ type: LayoutType.CATEGORY, category: CategoriesItem })
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

enum LayoutType {
    BANNER = 'banner',
    FAQ = 'FAQ',
    CATEGORY = 'Categories'
}

export const editLayout = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.body;

        if (type === LayoutType.BANNER) {
            const bannerData: any = await LayoutModel.findOne({ type: LayoutType.BANNER });
    
            const { image, title, subTitle } = req.body;
    
            const data = image.startsWith("https")
              ? bannerData
              : await cloudeinary.v2.uploader.upload(image, {
                  folder: "layout",
                });
    
            const banner = {
              type: LayoutType.BANNER,
              image: {
                public_id: image.startsWith("https")
                  ? bannerData.banner.image.public_id
                  : data?.public_id,
                url: image.startsWith("https")
                  ? bannerData.banner.image.url
                  : data?.secure_url,
              },
              title,
              subTitle,
            };
    
            await LayoutModel.findByIdAndUpdate(bannerData._id, { banner });
          }

        if (type === LayoutType.FAQ) {
            const { faq } = req.body;
            const faqData = await LayoutModel.findOne({ type: LayoutType.FAQ });

            const faqItems = await Promise.all(
                faq.map(async (item: any) => ({
                    question: item.question,
                    answer: item.answer
                }))
            );

            await LayoutModel.findByIdAndUpdate(faqData?._id, { type: LayoutType.FAQ, faq: faqItems });
        }

        if (type === LayoutType.CATEGORY) {
            const { category } = req.body;
            const categoryData = await LayoutModel.findOne({ type: LayoutType.CATEGORY });

            const categoryItems = await Promise.all(
                category.map(async (item: any) => ({
                    title: item.title
                }))
            );

            await LayoutModel.findByIdAndUpdate(categoryData?._id, { type: LayoutType.CATEGORY, category: categoryItems });
        }

        res.status(200).json({
            success: true,
            message: "Layout updated successfully"
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});



export const getLayoutByType = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.params
        const getLayout = await LayoutModel.find({ type })
        res.status(200).json({
            success: true,
            getLayout
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})