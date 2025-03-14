import {
  pgTable,
  integer,
  pgEnum,
  date,
  json,
  varchar,
  serial,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { serviceTypeEnum } from "./enums";
import { relations } from "drizzle-orm";
import { user } from "./user";
import { serviceProvider } from "./serviceProvider";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "assigned",
  "rejected",
  "in_progress",
]);

export const emergencyRequest = pgTable("emergency_request", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => user.id)
    .notNull(),
  serviceProviderId: uuid("service_provider_id")
    .references(() => serviceProvider.id)
    .notNull(),
  serviceType: serviceTypeEnum("service_type").notNull(),
  requestStatus: requestStatusEnum("request_status")
    .notNull()
    .default("pending"),
  requestTime: timestamp("request_time").defaultNow(),
  dispatchTime: timestamp("dispatch_time"),
  arrivalTime: timestamp("arrival_time"),
  description: varchar({ length: 255 }),
  location: json("location").notNull(),

  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const emergencyRequestRelations = relations(
  emergencyRequest,
  ({ one }) => ({
    serviceProvider: one(serviceProvider, {
      fields: [emergencyRequest.serviceProviderId],
      references: [serviceProvider.id],
    }),

    userId: one(user, {
      fields: [emergencyRequest.userId],
      references: [user.id],
    }),
  })
);

export const emergencyRequestSchema = createSelectSchema(emergencyRequest);
export type TEmergencyRequest = z.infer<typeof emergencyRequestSchema>;
