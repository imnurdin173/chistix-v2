import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "crypto";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { sendMail } from "../utils/mailer";

import type {
  LoginInput,
  RegisterInput,
  googleLoginInput,
} from "../validations/auth.validation";

const googleClient = new OAuth2Client(env.googleClientId);

export function toPublicUser<T extends { password?: string | null }>(
  user: T,
): Omit<T, "password"> {
  const { password, ...publicUser } = user;
  return publicUser;
}

function generateReferralCode(name: string): string {
  const prefix = (
    name
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 4)
      .toUpperCase() || "USER"
  ).padEnd(4, "X");
  return `${prefix}${randomBytes(4).toString("hex").toUpperCase()}`;
}

function signToken(payload: { id: string; role: string }): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
}

const REFERRAL_POINTS_INVITER = 10;
const REFERRAL_POINTS_REFEREE = 5;


export async function registerUser(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existingUser) throw new AppError("Email already registered", 409);

  const hashedPassword = await bcrypt.hash(input.password, 10);
  // const referralCode = await generateReferralCode(input.name);

  
  let referrer: { id: string } | null = null;
  if (input.referralCode) {
    const owner = await prisma.user.findUnique({
      where: { referralCode: input.referralCode },
    });
    if (!owner || owner.deletedAt) {
      throw new AppError("Referral code not found", 400);
    }
    referrer = { id: owner.id };
  }

  // const user = await prisma.user.create({
  //   data: {
  //     name: input.name,
  //     email: input.email,
  //     password: hashedPassword,
  //     role: input.role,
  //     referralCode: generateReferralCode(input.name),
  //   },
  // });

  //create transaction yg ditambah referralCode
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: input.role,
        referralCode: generateReferralCode(input.name),
        referredById: referrer?.id,
        points: 0,
      },
    });

    return newUser;
  });

  try {
    const token = await createVerificationToken(user.id);
    const link = `${env.appUrl}/verify-registration?token=${token}`;
    await sendMail(user.email, "Verification Account Chistix", "verifyEmail", {
      name: user.name,
      link,
    });
  } catch (err) {
    console.error(
      "Failed to send email verif, but registr still success: ",
      err,
    );
  }
  return { user: toPublicUser(user) };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || user.deletedAt)
    throw new AppError("Email or Password is wrong", 401);

  if (!user.password) {
    throw new AppError(
      "Akun ini terdaftar via Google. Silakan login dengan tombol Google.",
      409,
    );
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password);
  if (!user.emailVerified) {
    throw new AppError(
      "Email not verrified yet. Please Check Inbox to verif woy",
      403,
    );
  }
  if (!isPasswordValid) throw new AppError("Email atau password salah", 401);

  const token = signToken({ id: user.id, role: user.role });
  return { user: toPublicUser(user), token };
}

export async function loginWithGoogle(input: googleLoginInput) {
  const ticket = await googleClient.verifyIdToken({
    idToken: input.credential,
    audience: env.googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new AppError("Token Google not Valid", 401);
  }

  const googleId = payload.sub;
  const email = payload.email;
  const emailVerified = payload.email_verified ?? false;
  const name = payload.name ?? email.split("@")[0];
  const image = payload.picture ?? null;

  const linkedAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: googleId,
      },
    },
    include: { user: true },
  });

  if (linkedAccount) {
    if (linkedAccount.user.deletedAt) {
      throw new AppError("This Account is not already activated", 401);
    }
    const token = signToken({
      id: linkedAccount.user.id,
      role: linkedAccount.user.role,
    });
    return { user: toPublicUser(linkedAccount.user), token };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser && !existingUser.deletedAt) {
    await prisma.account.create({
      data: {
        userId: existingUser.id,
        provider: "google",
        providerAccountId: googleId,
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        emailVerified: existingUser.emailVerified || emailVerified,
        image: existingUser.avatar ?? image,
      },
    });

    const token = signToken({ id: updatedUser.id, role: updatedUser.role });
    return { user: toPublicUser(updatedUser), token };
  }

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: null,
      emailVerified,
      referralCode: generateReferralCode(name),
      accounts: {
        create: { provider: "google", providerAccountId: googleId },
      },
    },
  });
}

export async function getMyProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.deletedAt) {
    throw new AppError("User Not FOund", 404);
  }
  return { user: toPublicUser(user) };
}

export const createVerificationToken = async (userId: string) => {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.verification.create({
    data: { token, expiresAt, userId },
  });
  return token;
};

export const verifyUserEmail = async (token: string) => {
  const verification = await prisma.verification.findUnique({
    where: { token },
  });

  if (!verification) {
    throw new AppError("Token Verif not valid", 400);
  }

  if (verification.expiresAt < new Date()) { 
    await prisma.verification.delete({ where: { id: verification.id } });
    throw new AppError("Token EXpired", 400);
  }

  // await prisma.$transaction([
  //   prisma.user.update({
  //     where: { id: verification.userId },
  //     data: { emailVerified: true },
  //   }),
  //   prisma.verification.delete({ where: { id: verification.id } }),
  // ]);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findFirst({
      where: { id: verification.userId, deletedAt: null },
    });

    if (!existing) {
      throw new AppError("User is not found", 404);
    }

    const claimed = await tx.user.updateMany({
      where: { id: existing.id, emailVerified: false },
      data: { emailVerified: true },
    });

    if (claimed.count === 0) {
      throw new AppError("Email is already verified", 400);
    }

    if (existing.referredById) {
      await tx.user.update({
        where: { id: existing.id },
        data: { points: { increment: REFERRAL_POINTS_REFEREE } },
      });

      await tx.user.update({
        where: { id: existing.referredById },
        data: { points: { increment: REFERRAL_POINTS_INVITER } },
      });
    }

    await tx.verification.delete({ where: { id: verification.id } });
  });

  return { message: "email verification succesful" };
};

export const resendVerificationEmail = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.deletedAt || user.emailVerified) return;

  await prisma.verification.deleteMany({ where: { userId: user.id } });

  const token = await createVerificationToken(user.id);
  const link = `${env.appUrl}/verify-registration?token=${token}`;
  await sendMail(user.email, "Verif Email Chistix", "verifyEmail", {
    name: user.name,
    link,
  });
};

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });

  // Skip diam: email tak terdaftar / akun Google (password null) → tanpa jejak
  if (user && user.password) {
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiredAt: new Date(Date.now() + 60 * 60 * 1000), // 60 menit
      },
    });

    const link = `${env.appUrl}/reset-password?token=${rawToken}`;

    try {
      await sendMail(user.email, "Reset Password Chistix", "resetPassword", {
        name: user.name,
        link,
      });
    } catch (err) {
      console.error(
        "Failed to send reset email, but request still success: ",
        err,
      );
    }
  }
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });
  if (!record) {
    throw new AppError("Invalid or expired reset token", 400);
  }
  if (record.usedAt) {
    throw new AppError("Reset token has already been used", 400);
  }
  if (record.expiredAt < new Date()) {
    throw new AppError("Reset token has expired", 400);
  }

  const user = await prisma.user.findFirst({
    where: { id: record.userId, deletedAt: null },
  });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: newPasswordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);
}
