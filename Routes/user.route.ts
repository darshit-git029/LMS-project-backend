import  express  from "express";
import { activateUser, registrationUser, updateAccessToken, userLogin, userLogout, getUserInfo, socialAuth, updateUser, updatePassword, updateProfilePhoto, getAllUserAdmin, updateUserRole, deleteUser } from "../controller/user.controller";
import { authoraiseRole, isAuthenticate } from "../middleware/auth";

const userRouter = express.Router()

userRouter.post("/registration", registrationUser)

userRouter.post("/activate-user", activateUser)

userRouter.post("/login",userLogin)

userRouter.get("/logout",isAuthenticate,userLogout)

userRouter.get('/refreshtoken',updateAccessToken)

userRouter.get("/me",isAuthenticate,getUserInfo)

userRouter.post("/socialauth",socialAuth)

userRouter.put("/updateuser",isAuthenticate,updateUser)

userRouter.put("/update/password",isAuthenticate,updatePassword)

userRouter.put("/update/profile/picture",isAuthenticate,updateProfilePhoto)

//admin access

userRouter.get("/get/user-admin",isAuthenticate,authoraiseRole("admin"),getAllUserAdmin)

userRouter.put("/update-user-role",isAuthenticate,authoraiseRole("admin"),updateUserRole)

userRouter.delete("/delete/user/:id",isAuthenticate,authoraiseRole("admin"),deleteUser)

export default userRouter;