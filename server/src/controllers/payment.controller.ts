import { Request, Response, NextFunction } from "express";
import {handlePaymentNotification} from "../services/payment.service";
import { successResponse } from "../utils/response";

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