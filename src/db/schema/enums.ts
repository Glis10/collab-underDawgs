import { pgEnum } from "drizzle-orm/pg-core";

export const serviceTypeEnum = pgEnum("service_type", [
  "ambulance",
  "police",
  "rescue_team",
  "fire_truck",
]);
