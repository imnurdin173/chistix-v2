import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { successResponse, errorResponse } from "./utils/response";
import healthRouter from "./routes/health.routes";
import authRouter from "./routes/auth.routes";
import eventRoutes from "./routes/event.routes";
import { ZodError } from "zod";
import { AppError } from "./utils/AppError";
import organizerRoutes from "./routes/organizer.routes";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/events", eventRoutes);
app.get("/", (_req: Request, res: Response) => {
  successResponse(res, 200, "Welcome to Chistix API");
});
app.use("/api/organizers", organizerRoutes);

//---------------------- batas error :v

app.use((req: Request, res: Response) => {
  errorResponse(
    res,
    404,
    `Route ${req.method} ${req.originalUrl} tidak ditemukan`,
  );
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


//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjkwOTA1YzI2LTQ0MTMtNDkwMC1iNDQ2LTlkYzZjOWUyNWZkYyIsInJvbGUiOiJPUkdBTklaRVIiLCJpYXQiOjE3OTI5MjM3NDMsImV4cCI6MTc5MzUyODU0M30.sMh1jfMly8T4mRqSg3XYUumERNksCgO0O_yI4saWBLo
// { "email": "organizer@chistix.test", "password": "Password123!" }
// {"email":"orgfake@thip-like.com","password":"rahasia123"}
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZkYWEzNThhLTdiZjEtNDU0Mi1iNTU5LTRkYjhlNWE2YTA1OSIsInJvbGUiOiJPUkdBTklaRVIiLCJpYXQiOjE3OTI5MjM4NzQsImV4cCI6MTc5MzUyODY3NH0.pnXtzRtWrPGTWd_Ixvzx51z1-P5LMtXzyd_61I-hFmM

// id event: a889eec8-4ceb-44c1-9474-df6479270708