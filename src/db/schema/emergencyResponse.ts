import {
  pgTable,
  serial,
  integer,
  pgEnum,
  varchar,
  timestamp,
  uuid,
  json,
} from "drizzle-orm/pg-core";
import { emergencyRequest } from "./emergencyRequest";
import { serviceProvider } from "./serviceProvider";
import { relations } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

export const statusUpdateEnum = pgEnum("status_update", [
  "accepted",
  "arrived",
  "on_route",
  "rejected",
]);

export const emergencyResponse = pgTable("emergency_response", {
  id: uuid("id").defaultRandom().primaryKey(),
  emergencyRequestId: uuid("emergency_request_id").references(
    () => emergencyRequest.id
  ),
  serviceProviderId: uuid("service_provider_id").references(
    () => serviceProvider.id
  ),

  statusUpdate: statusUpdateEnum("status_update").default("accepted"),

  originLocation: json("location")
    .$type<{
      latitude: string;
      longitude: string;
    }>()
    .notNull(),

  destinationLocation: json("location")
    .$type<{
      latitude: string;
      longitude: string;
    }>()
    .notNull(),

  assignedAt: timestamp("assigned_at"),
  respondedAt: timestamp("responded_at").defaultNow(),
  updateDescription: varchar({ length: 255 }),

  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const emergencyResponseRelations = relations(
  emergencyResponse,
  ({ one }) => ({
    emergencyRequestId: one(emergencyRequest, {
      fields: [emergencyResponse.emergencyRequestId],
      references: [emergencyRequest.id],
    }),

    serviceProviderId: one(serviceProvider, {
      fields: [emergencyResponse.serviceProviderId],
      references: [serviceProvider.id],
      relationName: "emergency_requests",
    }),
  })
);

export const emergencyResponseSchema = createSelectSchema(emergencyResponse);
export type TEmergencyResponse = z.infer<typeof emergencyResponseSchema>;
