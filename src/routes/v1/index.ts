import { Router } from "express";

import userRouter from "@/routes/v1/user.routes";
import serviceProviderRouter from "@/routes/v1/service-provider.routes";
import organizationRouter from "@/routes/v1/organization.routes";
import emergencyRequestRouter from "@/routes/v1/emergency-request.routes";
import mapsRouter from "@/routes/v1/maps.routes";
import emergencyResponseRouter from "./emergency-response.routes";
import healthCheckRouter from "./healthcheck.routes";
import feedbackRouter from "./feedback.routes";
import emergencyContactsRouter from "./emergency-contacts.routes";
import notificationRouter from "./notification.routes";

const v1Router = Router();

// Health Check Router
v1Router.use("/healthcheck", healthCheckRouter);

v1Router.use("/user", userRouter);
v1Router.use("/service-provider", serviceProviderRouter);
v1Router.use("/organization", organizationRouter);
v1Router.use("/emergency-request", emergencyRequestRouter);
v1Router.use("/maps", mapsRouter);
v1Router.use("/emergency-response", emergencyResponseRouter);
v1Router.use("/feedback", feedbackRouter);
v1Router.use("/emergency-contacts", emergencyContactsRouter);
v1Router.use("/notifications", notificationRouter);

export { v1Router };
