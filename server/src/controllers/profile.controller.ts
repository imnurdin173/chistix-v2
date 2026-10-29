import { Request, Response } from "express";
import { successResponse } from "../utils/response";
import * as profileService from "../services/profile.service";
import { changePasswordSchema, updateProfileSchema } from "../validations/profile.validation";

export const getProfileMeHandler = async (req: Request, res: Response) => {
    const user = await profileService.getMyProfile(req.user!.id);
    return successResponse(res, 200, "Profile fetched succesfully /get", user);
};

export const updateProfileMeHandler = async (req: Request, res: Response) => {
    const body = updateProfileSchema.parse(req.body);
    const user = await profileService.updateMyProfile(req.user!.id, body);
    return successResponse(res, 200, "Profile updated succesfully", user);
};

export const changePasswordHandler = async (req: Request, res: Response) => {
    const body = changePasswordSchema.parse(req.body);
    await profileService.changeMyPassword(req.user!.id, body);
    return successResponse(res, 200, "Password updated Succesfully");
}

export const deleteAccountHandler = async (req:Request, res: Response) => {
    await profileService.deletingMyAccount(req.user!.id);
    return successResponse(res, 200, "Account succesfully DELETED");
}