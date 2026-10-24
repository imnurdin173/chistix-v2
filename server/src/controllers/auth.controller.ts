import { NextFunction, Request, Response } from "express";
import { registerUser, loginUser, loginWithGoogle } from "../services/auth.service";
import { successResponse } from "../utils/response";
import { registerSchema, loginSchema, googleLoginSchema } from "../middlewares/auth.midleware";

export async function registerHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const input = registerSchema.parse(req.body);
        const result = await registerUser(input);
        return successResponse(res, 201, "Register successful", result);
    } catch (err) {
        next(err);
    }
}

export async function loginHandler(req:Request, res: Response, next: NextFunction) {
    try {
        const input = loginSchema.parse(req.body);
        const result = await loginUser(input);
        return successResponse(res, 200, "Login successful", result);
    } catch (err) {
        next(err);
    }
}

export async function googleLoginHandler(req:Request, res: Response, next: NextFunction) {
    try {
        const input = googleLoginSchema.parse(req.body);
        const result = await loginWithGoogle(input);
    return successResponse(res, 200, "Login By Google successful", result);
    } catch(err) {
        next(err);
    }
}