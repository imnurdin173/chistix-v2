import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { successResponse, errorResponse } from "./utils/response";
import healthRouter from "./routes/health.routes";
import authRouter from "./routes/auth.routes";
import { ZodError } from "zod";
import { AppError } from "./utils/AppError";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);

app.get("/", (_req: Request, res: Response) => {
  successResponse(res, 200, "Welcome to Chistix API");
});

app.use((req: Request, res: Response) => {
  errorResponse(res, 404,`Route ${req.method} ${req.originalUrl} tidak ditemukan`);
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validasi gagal",
      errors: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }
  errorResponse(res, 500, err.message || "THere's problem on Server");
});

export default app;
