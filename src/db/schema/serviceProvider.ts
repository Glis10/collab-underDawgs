import { relations } from "drizzle-orm";
import {
  integer,
  json,
  pgEnum,
  pgTable,
  varchar,
  timestamp,
  uuid,
  bigint,
} from "drizzle-orm/pg-core";
import { serviceTypeEnum } from "./enums";
import { emergencyRequest } from "./emergencyRequest";
import { emergencyResponse } from "./emergencyResponse";
import { feedback } from "./feedback";
import { createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { organization } from "./organization";

export const statusTypeEnum = pgEnum("service_status", [
  "available",
  "assigned",
  "off_duty",
]);

export const serviceProvider = pgTable("service_provider", {
  id: uuid("id").defaultRandom().primaryKey().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  age: integer("age").notNull(),
  phoneNumber: bigint("phone_number", { mode: "bigint" }).notNull().unique(),
  primaryAddress: varchar("primary_address", { length: 255 }).notNull(),
  serviceType: serviceTypeEnum("service_type").notNull(),
  organizationId: uuid("organization_id")
    .references(() => organization.id)
    .notNull(),
  currentLocation: json("current_location").default({
    latitude: "",
    longitude: "",
  }),
  serviceStatus: statusTypeEnum("service_status")
    .notNull()
    .default("available"),

  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const serviceProviderRelations = relations(
  serviceProvider,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [serviceProvider.organizationId],
      references: [organization.id],
    }),
    emergencyResponse: many(emergencyResponse),
    emergencyRequest: many(emergencyRequest),
    feedback: many(feedback),
  })
);

// Define the serviceProvider schema
export const serviceProviderSchema = createSelectSchema(serviceProvider);
export type TServiceProvider = z.infer<typeof serviceProviderSchema>;
