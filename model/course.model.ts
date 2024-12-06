import mongoose, { Date, Document, Model, model, Schema } from "mongoose";
import dotenv from "dotenv";
import { title } from "process";
import { IUser } from "./user.model";
dotenv.config();

interface IComment extends Document {
  user: object;
  question: string;
  questionReplies: IComment[];
}

interface IReview extends Document {
  user: object;
  rating: number;
  comment: string;
  commentReplies: IComment[];
}

interface ILink extends Document {
  title: string;
  url: string;
}

interface ICourseData extends Document {
  title: string;
  description: string;
  videoUrl: string;
  videothubnail: object;
  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  links: ILink[];
  suggeestion: string;
  questions: IComment[];
}

export interface ICourse extends Document {
  name: string;
  description: string;
  category: string;
  price: number;
  estimatedPrice: number;
  thubnail: object;
  tags: string;
  level: string;
  demoUrl: string;
  benefits: { title: string }[];
  perrequistites: { title: string }[];
  reviews: IReview[];
  courseData: ICourseData[];
  rating?: number;
  purchased: number;
}

const reviewSchema = new Schema<IReview>({
  user: { type: mongoose.Types.ObjectId },
  rating: {
    type: Number,
    default: 0,
  },
  comment: String,
  commentReplies: Object,
});

const linkSchema = new Schema<ILink>({
  title: String,
  url: String,
});

const commentSchema = new Schema<IComment>({
  user: { type: mongoose.Types.ObjectId },
  question: String,
  questionReplies: [Object],
});

const courseDataSchema = new Schema<ICourseData>({
  title: String,
  description: String,
  videoUrl: String,
  videoSection: String,
  videoLength: Number,
  videoPlayer: String,
  links: [linkSchema],
  suggeestion: String,
  questions: [commentSchema],
});

const courseSchema = new Schema<ICourse>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    estimatedPrice: {
      type: Number,
    },
    thubnail: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    tags: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    demoUrl: {
      type: String,
      required: true,
    },
    benefits: [{ title: String }],
    perrequistites: [{ title: String }],
    reviews: [reviewSchema],
    courseData: [courseDataSchema],
    rating: {
      type: Number,
      default: 0,
    },
    purchased: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const courseModel: Model<ICourse> = mongoose.model("Course", courseSchema);
export default courseModel;
