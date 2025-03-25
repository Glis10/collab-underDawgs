import { Router } from "express";

import userRouter from "@/routes/v1/user.routes";
import serviceProviderRouter from "@/routes/v1/service-provider.routes";
import organizationRouter from "@/routes/v1/organization.routes";

const v1Router = Router();

v1Router.use("/user", userRouter);
v1Router.use("/service-provider", serviceProviderRouter);
v1Router.use("/organization", organizationRouter);

export { v1Router };
