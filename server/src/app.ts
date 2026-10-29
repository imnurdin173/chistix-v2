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
import { mountRouter } from './utils/routeRegistry';
import apiIndexRouter from './routes/apiIndex.routes';
import transactionRoutes from "./routes/transaction.routes";
import paymentRouter from "./routes/payment.routes";
import profileRouter from "./routes/profile.routes";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

// app.get("/", (_req: Request, res: Response) => {
//   successResponse(res, 200, "Welcome to Chistix API");
// });

// app.use("/api/health", healthRouter);
// app.use("/api/auth", authRouter);
// app.use("/api/events", eventRoutes);
// app.use("/api/organizers", organizerRoutes);

mountRouter(app, '/', 'Katalog API', apiIndexRouter);
mountRouter(app, '/api', 'Katalog API', apiIndexRouter);
mountRouter(app, "/api/health", 'Sistem',healthRouter);
mountRouter(app, "/api/auth", 'Authentikasi', authRouter);
mountRouter(app, "/api/profile", 'Profile data', profileRouter);
mountRouter(app, "/api/events", 'Event', eventRoutes);
mountRouter(app, "/api/organizers", 'Organizers:Events', organizerRoutes);
// mountRouter(app, "/api/transactions", 'Transaksi', organizerRoutes);
mountRouter(app, '/api/transactions', 'Transaksi', transactionRoutes);
mountRouter(app, "/api/payments","Pembayaran:Midtrans",paymentRouter);


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
