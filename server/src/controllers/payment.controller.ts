import { Request, Response, NextFunction } from "express";
import { handlePaymentNotification, syncPaymentStatus } from "../services/payment.service";
import { successResponse } from "../utils/response";
import { AppError } from "../utils/AppError";

export const handleNotification = async (
    req:Request, res:Response, next: NextFunction
) => {
    try {
        const result = await handlePaymentNotification(req.body);
        return successResponse(res, 200, "Notification is on process", result);
    } catch (err) {
        next(err);
    }
};

// POST /api/payments/:id/sync — invoice asks "has this order been paid?"
export const syncPaymentStatusHandler = async (
    req: Request, res: Response, next: NextFunction
) => {
    try {
        if (!req.user) {
            throw new AppError("Please log in first", 401);
        }
        const result = await syncPaymentStatus(req.user.id, String(req.params.id));
        return successResponse(res, 200, "Payment status checked", result);
    } catch (err) {
        next(err);
    }
};
