import { Router } from "express";
import { changePasswordHandler, getProfileMeHandler, updateProfileMeHandler } from "../controllers/profile.controller";
import { verifyToken } from "../middlewares/auth.midleware";

const profileRouter = Router();
profileRouter.get("/me", verifyToken, getProfileMeHandler);
profileRouter.put("/me", verifyToken, updateProfileMeHandler);
profileRouter.put("/change-password", verifyToken, changePasswordHandler);

export default profileRouter;