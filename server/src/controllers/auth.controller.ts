import { NextFunction, Request, Response } from "express";
import {
  registerUser,
  loginUser,
  loginWithGoogle,
  getMyProfile,
  toPublicUser,
  verifyUserEmail
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
import { env } from "../config/env";
import { sendMail } from "../utils/mailer";

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

export const verifyEmailHandler = async (req:Request, res: Response, next:NextFunction) => {
    try {
        const token = req.query.token as string | undefined;
        if(!token) {
            return errorResponse(res, 400, "Token must be on URL");
        }
        const result = await verifyUserEmail(token);
        return successResponse(res, 200, result.message);
    } catch (err) {
        next(err);
    }
};

// SEMENTARA: untuk tes SMTP saja, nanti bisa dihapus
export const testEmailHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await sendMail(
      env.smtpUser,
      "Preview: Email Verifikasi Chistix",
      "verifyEmail", // nama file, tanpa .hbs
      {
        name: "Budi (Tes)",
        link: "https://example.com/verifikasi-palsu", // dummy — diganti token asli di langkah berikutnya
      }
    );
    return successResponse(res, 200, "Email terkirim! Cek inbox kamu");
  } catch (err) {
    next(err);
  }
};