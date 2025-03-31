import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  uuid,
  bigint,
} from "drizzle-orm/pg-core";
import { user } from "./user";
import { relations } from "drizzle-orm";
import { serviceProvider } from "./serviceProvider";
import { createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

export const locationTracking = pgTable("location_tracking", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => user.id),
  serviceProviderId: uuid("service_provider_id").references(
    () => serviceProvider.id
  ),
  userLatitude: bigint("user_latitude", { mode: "number" }).notNull(),
  usrLongitude: bigint("user_longitude", { mode: "number" }).notNull(),
  serivceProviderLatitude: bigint("service_provider_latitude", {
    mode: "number",
  }).notNull(),
  serviceProviderLongitude: bigint("service_provider_longitude", {
    mode: "number",
  }).notNull(),

  originLatitude: bigint("origin_latitude", { mode: "number" }).notNull(),
  originLongitude: bigint("origin_longitude", { mode: "number" }).notNull(),

  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const locationTrackingRelations = relations(
  locationTracking,
  ({ one }) => ({
    userId: one(user, {
      fields: [locationTracking.userId],
      references: [user.id],
    }),

    serviceProviderId: one(serviceProvider, {
      fields: [locationTracking.serviceProviderId],
      references: [serviceProvider.id],
    }),
  })
);

export const locationTrackingSchema = createSelectSchema(locationTracking);
export type TLocationTracking = z.infer<typeof locationTrackingSchema>;
