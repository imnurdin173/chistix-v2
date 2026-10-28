import { Router } from "express";
import { getProfileMeHandler } from "../controllers/profile.controller";
import { verifyToken } from "../middlewares/auth.midleware";

const profileRouter = Router();
profileRouter.get("/me", verifyToken, getProfileMeHandler);

export default profileRouter;