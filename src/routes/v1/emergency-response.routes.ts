import {
  createEmergencyResponse,
  deleteEmergencyResponse,
  getEmergencyResponse,
  getProviderResponses,
  updateEmergencyResponse,
} from "@/controllers/emergency-response.controller";
import {
  validateRoleAuth,
  validateServiceProvider,
} from "@/middlewares/auth.middleware";
import { Router } from "express";

const emergencyResponseRouter = Router();

emergencyResponseRouter
  .route("/")
  // .get(validateRoleAuth(["user"]), getEmergencyResponse)
  .post(validateRoleAuth(["user"]), createEmergencyResponse);

emergencyResponseRouter
  .route("/provider-responses")
  .get(validateServiceProvider, getProviderResponses);

emergencyResponseRouter
  .route("/:id")
  .get(getEmergencyResponse)
  .put(updateEmergencyResponse)
  .delete(validateRoleAuth(["admin"]), deleteEmergencyResponse);

export default emergencyResponseRouter;
