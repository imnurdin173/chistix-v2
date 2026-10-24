import { NextFunction, Request, Response } from "express";
import {
  registerUser,
  loginUser,
  loginWithGoogle,
  getMyProfile,
  toPublicUser
} from "../services/auth.service";
import { successResponse } from "../utils/response";
import {
  registerSchema,
  loginSchema,
  googleLoginSchema,
} from "../validations/auth.validation";
import { AppError } from "../utils/AppError";
import { errorResponse } from "../utils/response";
import { prisma } from "../config/prisma";

export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = registerSchema.parse(req.body);
    const result = await registerUser(input);
    return successResponse(res, 201, "Register successful", result);
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input);
    return successResponse(res, 200, "Login successful", result);
  } catch (err) {
    next(err);
  }
}

export async function googleLoginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = googleLoginSchema.parse(req.body);
    const result = await loginWithGoogle(input);
    return successResponse(res, 200, "Login By Google successful", result);
  } catch (err) {
    next(err);
  }
}

export const meHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return errorResponse(res, 401, "Silakan login terlebih dahulu");
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },    
    });

    if (!user || user.deletedAt) {
      return errorResponse(res, 404, "User tidak ditemukan");
    }

    return successResponse(res, 200, "Get current user successful", toPublicUser(user));
  } catch (err) {
    next(err);
  }
};
