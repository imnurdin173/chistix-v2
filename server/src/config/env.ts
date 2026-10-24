import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL ?? "",
  directUrl: process.env.DIRECT_URL ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID as string,
  jwtSecret: process.env.JWT_SECRET as string,
  smtpHost: process.env.SMTP_HOST as string,
  smtpPort: Number(process.env.SMTP_PORT),
  smtpUser: process.env.SMTP_USER as string,
  smtpPass: process.env.SMTP_PASS as string,
  appUrl: process.env.APP_URL as string,
};