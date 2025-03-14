import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  uuid,
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
  latitude: varchar({ length: 255 }).notNull(),
  longitude: varchar({ length: 255 }).notNull(),

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
