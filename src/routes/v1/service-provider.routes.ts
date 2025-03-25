import {
  forgotServiceProviderPassword,
  getServiceProvider,
  getServiceProviderProfile,
  loginServiceProvider,
  logoutServiceProvider,
  registerServiceProvider,
  resetServiceProviderPassword,
  updateServiceProvider,
  verifyServiceProvider,
} from "@/controllers/service-provider.controller";
import { validateServiceProvider } from "@/middlewares/auth.middleware";
import { Router } from "express";

const serviceProviderRouter = Router();

serviceProviderRouter.route("/register").post(registerServiceProvider);
serviceProviderRouter.route("/login").post(loginServiceProvider);
serviceProviderRouter
  .route("/logout")
  .get(validateServiceProvider, logoutServiceProvider);

serviceProviderRouter
  .route("/update")
  .put(validateServiceProvider, updateServiceProvider);

serviceProviderRouter.route("/verify").post(verifyServiceProvider);
serviceProviderRouter
  .route("/forgot-password")
  .post(forgotServiceProviderPassword);
serviceProviderRouter
  .route("/reset-password")
  .post(resetServiceProviderPassword);

serviceProviderRouter
  .route("/profile")
  .get(validateServiceProvider, getServiceProviderProfile);
serviceProviderRouter.route("/:id").get(getServiceProvider);

export default serviceProviderRouter;
