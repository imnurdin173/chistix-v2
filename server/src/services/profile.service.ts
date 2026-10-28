import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

export async function getMyProfile(userId: string) {
    const user = await prisma.user.findFirst({
        where: {id: userId, deletedAt:null},
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
    if(!user) {
        throw new AppError("User Not FOund", 404);
    }
    return user;
}