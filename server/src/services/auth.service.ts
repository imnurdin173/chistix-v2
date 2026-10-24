import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import type {
  LoginInput,
  RegisterInput,
  googleLoginInput,
} from "../middlewares/auth.midleware";

const googleClient = new OAuth2Client(env.googleClientId);

function toPublicUser<T extends { password?: string | null }>(
  user: T,
): Omit<T, "password"> {
  const { password, ...publicUser } = user;
  return publicUser;
}

function generateReferralCode(name: string): string {
  const prefix =
    (name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "USER").padEnd(4, "X");
  return `${prefix}${randomBytes(4).toString("hex").toUpperCase()}`;
}

function signToken(payload: { id: string; role: string }): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
}

export async function registerUser(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existingUser) throw new AppError("Email already registered", 409);

  const hashedPassword = await bcrypt.hash(input.password, 10);
  // const referralCode = await generateReferralCode(input.name);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: input.role,
      referralCode: generateReferralCode(input.name),
    },
  });
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
