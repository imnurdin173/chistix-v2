import { Router } from "express";
import { getProfileMeHandler, updateProfileMeHandler } from "../controllers/profile.controller";
import { verifyToken } from "../middlewares/auth.midleware";

const profileRouter = Router();
profileRouter.get("/me", verifyToken, getProfileMeHandler);
profileRouter.put("/me", verifyToken, updateProfileMeHandler);

export default profileRouter;