import {
  createEmergencyRequest,
  deleteEmergencyRequest,
  getEmergencyRequest,
  getUsersEmergencyRequests,
  updateEmergencyRequest,
  getRecentEmergencyRequests,
} from "@/controllers/emergency-request.controller";
import { validateRoleAuth } from "@/middlewares/auth.middleware";
import { Router } from "express";

const emergencyRequestRouter = Router();

emergencyRequestRouter
  .route("/")
  .get(validateRoleAuth(["user"]), getUsersEmergencyRequests)
  .post(validateRoleAuth(["user"]), createEmergencyRequest);

emergencyRequestRouter.get(
  "/recent",
  validateRoleAuth(["user"]),
  getRecentEmergencyRequests
);
emergencyRequestRouter
  .route("/:id")
  .get(getEmergencyRequest)
  .put(updateEmergencyRequest)
  .delete(validateRoleAuth(["admin"]), deleteEmergencyRequest);

export default emergencyRequestRouter;
