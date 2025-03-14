import { TUser } from "@/db/schema";

declare global {
  namespace Express {
    interface Request {
      user: Partial<TUser>;
    }
  }
}
