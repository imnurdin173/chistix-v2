import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import {
  changePasswordInput,
  updateProfileInput,
} from "../validations/profile.validation";

export async function getMyProfile(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      points: true,
      referralCode: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) {
    throw new AppError("User Not FOund", 404);
  }
  return user;
}

export async function updateMyProfile(
  userId: string,
  data: updateProfileInput,
) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!user) {
    throw new AppError("User Not Found /update", 404);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      points: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return updatedUser;
}

export async function changeMyPassword(
  userId: string,
  data: changePasswordInput,
) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!user) {
    throw new AppError("User Not FOund", 404);
  }

  if (!user.password) {
    throw new AppError(
      "This account signs in with Google and has no password to change",
      400,
    );
  }

  const isOldPasswordValid = await bcrypt.compare(
    data.oldPassword,
    user.password,
  );
  if (!isOldPasswordValid) {
    throw new AppError("Old Password is incorrect", 401);
  }

  const newPasswordHash = await bcrypt.hash(data.newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: newPasswordHash },
  });
}
