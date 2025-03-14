import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { envConfig } from "@/config/env.config";
import * as schema from "./schema/index";

const db = drizzle(envConfig.database_url!, { schema });

export default db;
