import twilio from "twilio";
import { envConfig } from "@/config/env.config";

const accountSid = envConfig.twilio_account_sid;
const authToken = envConfig.twilio_auth_token;
const twilioClient = twilio(accountSid, authToken);

export default twilioClient;
