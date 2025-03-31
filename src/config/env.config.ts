export const envConfig = {
  port: process.env.PORT || 3000,
  database_url: process.env.DATABASE_URL,
  jwt_secret: String(process.env.JWT_SECRET),
  jwt_expiry: Number(process.env.JWT_EXPIRY),
  otp_secret: String(process.env.OTP_SECRET),
  twilio_account_sid: String(process.env.TWILIO_ACCOUNT_SID),
  twilio_auth_token: String(process.env.TWILIO_AUTH_TOKEN),
  galli_maps_token: String(process.env.GALLI_MAPS_TOKEN),
};
