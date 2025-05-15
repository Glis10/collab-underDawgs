import { Router } from "express";
import {
  getNotifications,
  markAsRead,
} from "@/controllers/notification.controller";
import { validateRoleAuth } from "@/middlewares/auth.middleware";

const router = Router();

const authenticateUser = validateRoleAuth(["user"]);
router.post("/", authenticateUser, getNotifications);
router.put("/:id/read", authenticateUser, markAsRead);
router.post("/token", authenticateUser);

export default router;
