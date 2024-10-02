import mongoose, { Document, Model, model, Schema } from "mongoose";
import bcrypt from "bcryptjs"

const emailParttren: RegExp = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/

//interface user model schema
export interface IUser extends Document {
    name: string
    email: string
    password: string
    avatar: {
        public_id: string
        url: string
    }
    role: string
    isVarifiyed: boolean
    courses: Array<{ courseId: string }>
    commparePassword: (password: string) => Promise<boolean>
}

const userSchema: Schema<IUser> = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "please enter your name"]
    },
    email: {
        type: String,
        required: [true, "please enter your email"],
        validate: {
            validator: function (value: string) {
                return emailParttren.test(value)
            },
            message: "Please enter valid email"
        },
        unique: true
    },
    password: {
        type: String,
        required: [true, "please enter your password"],
        minlength: [6, "password must be at least 6 characters"],
        select: false
    },
    avatar: {
        public_id: String,
        url: String
    },
    role: {
        type: String,
        default: "user"
    },
    isVarifiyed: {
        type: Boolean,
        default: false
    },
    courses: [{
        courseId: String
    }
    ]

}, { timestamps: true })

//hashpassword before saving 
userSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified('password')) {
         next()
    }
    this.password = await bcrypt.hash(this.password, 10);
    next()
})

//compare password original password and enterpassword
userSchema.methods.comparePassword = async function (enterdPassword:string): Promise<Boolean>{
    return bcrypt.compare(enterdPassword,this.password)
}


const usermodel: Model<IUser> = mongoose.model("User",userSchema)
export default usermodel