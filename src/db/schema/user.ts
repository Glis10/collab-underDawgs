import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  varchar,
  boolean,
  bigint,
  timestamp,
  uuid,
  json,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { emergencyRequest } from "./emergencyRequest";
import { feedback } from "./feedback";
import { locationTracking } from "./locationTracking";

export const userRolesEnum = pgEnum("role", ["admin", "user"]);

export const user = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey().unique(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  phoneNumber: bigint("phone_number", { mode: "number" }).notNull().unique(),
  email: varchar({ length: 255 }).notNull().unique(),
  primaryAddress: varchar("primary_address", { length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  isVerfied: boolean("is_verified").default(false),
  role: userRolesEnum().default("user"),
  profilePicture: varchar("profile_picture", { length: 255 }),
  verificationToken: varchar("verification_token", { length: 255 }),
  tokenExpiry: timestamp("token_expiry", { mode: "string" }),
  socketId: varchar("socket_id", { length: 255 }),
  currentLocation: json("current_location")
    .$type<{
      latitude: string;
      longitude: string;
    }>()
    .default({
      latitude: "",
      longitude: "",
    }),

  resetPasswordToken: varchar("reset_password_token", { length: 255 }),
  resetPasswordTokenExpiry: timestamp("reset_password_token_expiry", {
    mode: "string",
  }),

  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const userRelations = relations(user, ({ many }) => ({
  emergencyRequest: many(emergencyRequest),
  feedback: many(feedback),
  locationTracking: many(locationTracking),
}));

export const usersSchema = createSelectSchema(user);
export const newUserSchema = createInsertSchema(user).pick({
  name: true,
  age: true,
  phoneNumber: true,
  email: true,
  primaryAddress: true,
  password: true,
});

export const loginUserSchema = createInsertSchema(user).pick({
  phoneNumber: true,
  password: true,
});
export const userRolesSchema = createSelectSchema(userRolesEnum);

export type TUserRole = z.infer<typeof userRolesSchema>;
export type TUser = z.infer<typeof usersSchema>;
export type TNewUser = z.infer<typeof newUserSchema>;
