import {
  changePassword,
  forgotPassword,
  getProfile,
  getUser,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  updateUser,
  verifyUser,
} from "@/controllers/user.controller";
import { validateRoleAuth } from "@/middlewares/auth.middleware";
import express from "express";

const userRouter = express.Router();
const validateUser = validateRoleAuth(["user"]);

userRouter.route("/register").post(registerUser);
userRouter.route("/login").post(loginUser);
userRouter
  .route("/logout")
  .get(validateRoleAuth(["admin", "user"]), logoutUser);

userRouter
  .route("/update")
  .put(validateRoleAuth(["admin", "user"]), updateUser);

userRouter.route("/verify").post(verifyUser);
userRouter.route("/forgot-password").post(forgotPassword);
userRouter.route("/reset-password").post(resetPassword);
userRouter.route("/change-password").post(validateUser, changePassword);

userRouter.route("/profile").get(validateUser, getProfile);
userRouter.route("/:userId").get(getUser);

export default userRouter;
