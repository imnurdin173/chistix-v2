import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { updateProfileInput } from "../validations/profile.validation";


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

export async function updateMyProfile(userId: string, data: updateProfileInput) {
    const user = await prisma.user.findFirst({
        where: {id: userId, deletedAt:null},
    });
    if(!user) {
        throw new AppError("User Not Found /update", 404);
    }

    const updatedUser = await prisma.user.update({
        where: {id: userId},
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