import db from "@/db";
import { emergencyContact } from "@/db/schema";
import ApiError from "@/utils/api/ApiError";
import ApiResponse from "@/utils/api/ApiResponse";
import { asyncHandler } from "@/utils/api/asyncHandler";
import { eq, and, desc } from "drizzle-orm";
import type { Request, Response } from "express";

const createEmergencyContact = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, phoneNumber, isCommanContact, relationship } = req.body;
    const { id: userId } = req.user;

    if (!userId) throw new ApiError(401, "Unauthorized to perform this action");

    if (!name || !phoneNumber || !relationship) {
      throw new ApiError(400, "Missing required fields");
    }

    const newContact = await db
      .insert(emergencyContact)
      .values({
        name,
        phoneNumber,
        relationship,
        isCommanContact: isCommanContact ?? false,
        userId,
      })
      .returning();

    res
      .status(201)
      .json(new ApiResponse(201, "Emergency contact created", newContact[0]));
  }
);

const updateEmergencyContact = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { id: userId } = req.user;
    const updateData = req.body;

    if (!userId) throw new ApiError(401, "Unauthorized");

    const existing = await db.query.emergencyContact.findFirst({
      where: eq(emergencyContact.id, id),
    });

    if (!existing) throw new ApiError(404, "Contact not found");
    if (existing.userId !== userId) throw new ApiError(403, "Forbidden");

    const allowedFields = [
      "name",
      "phoneNumber",
      "relationship",
      "isCommanContact",
    ];
    const invalidKeys = Object.keys(updateData).filter(
      (key) => !allowedFields.includes(key)
    );

    if (invalidKeys.length > 0) {
      throw new ApiError(400, `Invalid fields: ${invalidKeys.join(", ")}`);
    }

    const updated = await db
      .update(emergencyContact)
      .set(updateData)
      .where(eq(emergencyContact.id, id))
      .returning();

    res
      .status(200)
      .json(new ApiResponse(200, "Emergency contact updated", updated[0]));
  }
);

const deleteEmergencyContact = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const contact = await db.query.emergencyContact.findFirst({
      where: eq(emergencyContact.id, id),
    });

    if (!contact) throw new ApiError(404, "Contact not found");
    if (role !== "admin" && contact.userId !== userId) {
      throw new ApiError(403, "Unauthorized to delete this contact");
    }

    const deleted = await db
      .delete(emergencyContact)
      .where(eq(emergencyContact.id, id))
      .returning();

    res
      .status(200)
      .json(new ApiResponse(200, "Emergency contact deleted", deleted[0]));
  }
);

const getEmergencyContact = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const contact = await db.query.emergencyContact.findFirst({
      where: eq(emergencyContact.id, id),
    });

    if (!contact) throw new ApiError(404, "Contact not found");

    res
      .status(200)
      .json(new ApiResponse(200, "Emergency contact found", contact));
  }
);

const getUserEmergencyContacts = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: userId } = req.user;

    if (!userId) throw new ApiError(401, "Unauthorized");

    const contacts = await db
      .select()
      .from(emergencyContact)
      .where(eq(emergencyContact.userId, userId))
      .orderBy(desc(emergencyContact.createdAt));

    res.status(200).json(new ApiResponse(200, "Contacts retrieved", contacts));
  }
);

const getCommonEmergencyContacts = asyncHandler(
  async (req: Request, res: Response) => {
    const contacts = await db
      .select()
      .from(emergencyContact)
      .where(eq(emergencyContact.isCommanContact, true))
      .orderBy(desc(emergencyContact.createdAt));

    res
      .status(200)
      .json(new ApiResponse(200, "Common contacts retrieved", contacts));
  }
);

export {
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  getEmergencyContact,
  getUserEmergencyContacts,
  getCommonEmergencyContacts,
};
