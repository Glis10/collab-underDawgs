import express from "express";
import {
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  getEmergencyContact,
  getUserEmergencyContacts,
  getCommonEmergencyContacts,
} from "@/controllers/emergency-contacts.controller";
import { validateRoleAuth } from "@/middlewares/auth.middleware";

const emergencyContactsRouter = express.Router();

emergencyContactsRouter
  .route("/")
  .post(validateRoleAuth(["user"]), createEmergencyContact)
  .get(validateRoleAuth(["user"]), getUserEmergencyContacts);

emergencyContactsRouter.get("/common/all", getCommonEmergencyContacts);

emergencyContactsRouter
  .route("/:id")
  .get(getEmergencyContact)
  .put(validateRoleAuth(["user"]), updateEmergencyContact)
  .delete(validateRoleAuth(["user", "admin"]), deleteEmergencyContact);

export default emergencyContactsRouter;
