import { Router } from "express";
import * as paymentController from "../controllers/payment.controller";
import { verifyToken } from "../middlewares/auth.midleware";

const paymentRouter = Router();

paymentRouter.post("/notification", paymentController.handleNotification);
// Logged-in customer checks the status of their own order
paymentRouter.post("/:id/sync", verifyToken, paymentController.syncPaymentStatusHandler);

export default paymentRouter;
