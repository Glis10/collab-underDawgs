import { healthCheck } from "@/controllers/healthcheck.controller";
import { Router } from "express";

const healthCheckRouter = Router();

healthCheckRouter.route("/").get(healthCheck);

export default healthCheckRouter;
