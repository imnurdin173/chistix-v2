import { Request, Response } from "express";
import { successResponse } from "../utils/response";
import * as profileService from "../services/profile.service";

export const getProfileMeHandler = async (req: Request, res: Response) => {
    const user = await profileService.getMyProfile(req.user!.id);
    return successResponse(res, 200, "Profile fetched succesfully /get", user);
};