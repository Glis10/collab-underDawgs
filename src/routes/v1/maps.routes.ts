import { getAutoComplete } from "@/controllers/maps.controller";
import { validateRoleAuth } from "@/middlewares/auth.middleware";
import { Router } from "express";

const mapsRouter = Router();

mapsRouter
  .route("/autocomplete")
  .get(validateRoleAuth(["user", "admin"]), getAutoComplete);

mapsRouter.route("/optimal-route").get(validateRoleAuth(["user", "admin"]));

export default mapsRouter;
