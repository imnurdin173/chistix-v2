import { NextFunction, Request, Response } from "express";
import {
  registerUser,
  loginUser,
  loginWithGoogle,
  getMyProfile,
  toPublicUser,
  verifyUserEmail,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword
} from "../services/auth.service";
import { successResponse } from "../utils/response";
import {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  resendSchema,
  forgotPasswordSchema,
  resetPasswordSchema
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



export const resendVerificationHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {email} = resendSchema.parse(req.body);
        await resendVerificationEmail(email);
        return successResponse(res, 200, "Check your inbox, new verif link has been sent. (only if your email has registered but not verrified yes)");
    } catch (err) {
        next(err);
    }
};
export const forgotPasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    await requestPasswordReset(email);
    return successResponse(res, 200, "If the email is registered, a password reset link has been sent");
  } catch (err) {
    next(err);
  }
};

export const resetPasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    await resetPassword(token, newPassword);
    return successResponse(res, 200, "Password has been reset successfully");
  } catch (err) {
    next(err);
  }
};

// export const testEmailHandler = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     await sendMail(
//       env.smtpUser,
//       "Preview: Email Verifikasi Chistix",
//       "verifyEmail", // nama file, tanpa .hbs
//       {
//         name: "Budi (Tes)",
//         link: "https://example.com/verifikasi-palsu", // dummy — diganti token asli di langkah berikutnya
//       }
//     );
//     return successResponse(res, 200, "Email terkirim! Cek inbox kamu");
//   } catch (err) {
//     next(err);
//   }
// };