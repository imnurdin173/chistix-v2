import { Router } from "express";
import * as paymentController from "../controllers/payment.controller";

const paymentRouter = Router();

paymentRouter.post("/notification", paymentController.handleNotification);

export default paymentRouter;