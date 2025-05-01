import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/api/asyncHandler";
import { notifications, TNotification } from "@/db/schema/notification";
import db from "@/db";
import { and, eq, gte, lte } from "drizzle-orm";
import ApiResponse from "@/utils/api/ApiResponse";

const getNotifications = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { markAsRead, fromDaysAgo, toDaysAgo } = req.body;

    const foundNotifications = await db.query.notifications.findMany({
      where: and(
        gte(notifications.createdAt, fromDaysAgo),
        lte(notifications.createdAt, toDaysAgo),
        eq(notifications.deliveryStatus, markAsRead ? "delivered" : "pending")
      ),
    });

    if (!foundNotifications) {
      return res
        .status(404)
        .json(new ApiResponse(404, "No notifications found", {}));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Notifications found", foundNotifications));
  }
);

const createNotification = (data: Partial<TNotification>) => {
  if (!data.message || !data.type || !data.source) {
    throw new Error("Missing required fields: message, type, or source");
  }

  const newNotification = db.insert(notifications).values({
    ...data,
    message: data.message,
    type: data.type,
    source: data.source,
  });

  return newNotification;
};

const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const updatedNotification = await db
    .update(notifications)
    .set({ deliveryStatus: "delivered" })
    .where(eq(notifications.id, id));

  if (!updatedNotification) {
    throw new Error("Error updating notification");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Notification updated", updatedNotification));
});

export { getNotifications, createNotification, markAsRead };
