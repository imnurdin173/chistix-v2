import {Response, Request, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const requireOrganizer = (
    req:Request, res: Response, next:NextFunction
) => {
    if(!req.user) {
        return next(new AppError("Please Login First", 401));
    }
    if (req.user.role !== "ORGANIZER") {
        return next(new AppError("Only Organizer can Access Event", 403));
    }
    next();
};