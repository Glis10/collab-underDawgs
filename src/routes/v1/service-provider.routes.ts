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
  deleteServiceProvider,
  updateServiceProviderStatus,
} from "@/controllers/service-provider.controller";
import { validateServiceProvider } from "@/middlewares/auth.middleware";
import { Router } from "express";

const serviceProviderRouter = Router();

// Public routes
serviceProviderRouter.post("/register", registerServiceProvider);
serviceProviderRouter.post("/login", loginServiceProvider);
serviceProviderRouter.post("/verify", verifyServiceProvider);
serviceProviderRouter.post("/forgot-password", forgotServiceProviderPassword);
serviceProviderRouter.post("/reset-password", resetServiceProviderPassword);

// Protected routes
serviceProviderRouter.use(validateServiceProvider);
serviceProviderRouter.post("/logout", logoutServiceProvider);
serviceProviderRouter.get("/profile", getServiceProviderProfile);
serviceProviderRouter.patch("/update", updateServiceProvider);
serviceProviderRouter.delete("/delete", deleteServiceProvider);
serviceProviderRouter.get("/:id", getServiceProvider);
serviceProviderRouter.patch("/status", updateServiceProviderStatus);

export default serviceProviderRouter;
