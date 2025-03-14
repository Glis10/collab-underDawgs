import {
  getProfile,
  getUser,
  loginUser,
  registerUser,
  updateUser,
  verifyUser,
} from "@/controllers/user/user.controller";
import { validateUser } from "@/middlewares/auth.middleware";
import express from "express";

const userRouter = express.Router();

userRouter.route("/").get(validateUser, getProfile);
userRouter.route("/").post(getUser);
userRouter.route("/register").post(registerUser);
userRouter.route("/login").post(loginUser);
userRouter.route("/update").put(validateUser, updateUser);
userRouter.route("/verify").post(verifyUser);

export default userRouter;
