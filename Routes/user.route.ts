import  express  from "express";
import { activateUser, registrationUser, updateAccessToken, userLogin, userLogout, getUserInfo, socialAuth, updateUser, updatePassword, updateProfilePhoto, getAllUserAdmin, updateUserRole, deleteUser } from "../controller/user.controller";
import { authoraiseRole, isAuthenticate } from "../middleware/auth";

const userRouter = express.Router()

userRouter.post("/registration", registrationUser)

userRouter.post("/activate-user", activateUser)

userRouter.post("/login",userLogin)

userRouter.get("/logout",updateAccessToken,isAuthenticate,userLogout)

userRouter.get("/refreshtoken",updateAccessToken)

userRouter.get("/me",updateAccessToken,isAuthenticate,getUserInfo)

userRouter.post("/socialauth",socialAuth)

userRouter.put("/updateuser",updateAccessToken,isAuthenticate,updateUser)

userRouter.put("/update/password",updateAccessToken,isAuthenticate,updatePassword)

userRouter.put("/update/profile/picture",updateAccessToken,isAuthenticate,updateProfilePhoto)

//admin access

userRouter.get("/get/user-admin",updateAccessToken,isAuthenticate,authoraiseRole("admin"),getAllUserAdmin)

userRouter.put("/update-user-role",updateAccessToken,isAuthenticate,authoraiseRole("admin"),updateUserRole)

userRouter.delete("/delete/user/:id",updateAccessToken,isAuthenticate,authoraiseRole("admin"),deleteUser)

export default userRouter;