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
  boolean,
} from "drizzle-orm/pg-core";
import { serviceTypeEnum } from "./enums";
import { emergencyResponse } from "./emergencyResponse";
import { feedback } from "./feedback";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
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
  email: varchar("email", { length: 255 }).notNull().unique(),
  phoneNumber: bigint("phone_number", { mode: "number" }).notNull().unique(),
  primaryAddress: varchar("primary_address", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  serviceType: serviceTypeEnum("service_type").notNull(),
  isVerfied: boolean("is_verified").default(false),
  profilePicture: varchar("profile_picture", { length: 255 }),
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
  verificationToken: varchar("verification_token", { length: 255 }),
  tokenExpiry: timestamp("token_expiry", { mode: "string" }),
  socketId: varchar("socket_id", { length: 255 }),

  resetPasswordToken: varchar("reset_password_token", { length: 255 }),
  resetPasswordTokenExpiry: timestamp("reset_password_token_expiry", {
    mode: "string",
  }),

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
    feedback: many(feedback),
  })
);

// Define the serviceProvider schema
export const serviceProviderSchema = createSelectSchema(serviceProvider);
export const newServiceProviderSchema = serviceProviderSchema.pick({
  name: true,
  age: true,
  email: true,
  phoneNumber: true,
  primaryAddress: true,
  password: true,
  serviceType: true,
  organizationId: true,
});


export const loginServiceProviderSchema = createInsertSchema(
  serviceProvider
).pick({
  phoneNumber: true,
  password: true,
});

export type TNewServiceProvider = z.infer<typeof newServiceProviderSchema>;
export type TServiceProvider = z.infer<typeof serviceProviderSchema>;
