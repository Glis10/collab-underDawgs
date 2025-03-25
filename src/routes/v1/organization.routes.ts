import {
  createOrganization,
  deleteOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
} from "@/controllers/organization.controller";
import { validateRoleAuth } from "@/middlewares/auth.middleware";
import { Router } from "express";

const organizationRouter = Router();
const validateAdmin = validateRoleAuth(["admin"]);

organizationRouter
  .route("/")
  .post(createOrganization)
  .get(validateAdmin, getAllOrganizations);

organizationRouter
  .route("/:id")
  .get(getOrganizationById)
  .delete(validateAdmin, deleteOrganization)
  .put(validateAdmin, updateOrganization);

export default organizationRouter;
