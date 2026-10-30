import { Router } from "express";
import {
  changePasswordHandler,
  deleteAccountHandler,
  getProfileMeHandler,
  updateProfileMeHandler,
  getReferralSummaryHandler,
} from "../controllers/profile.controller";
import { verifyToken } from "../middlewares/auth.midleware";

const profileRouter = Router();
profileRouter.get("/me", verifyToken, getProfileMeHandler);
profileRouter.put("/me", verifyToken, updateProfileMeHandler);
profileRouter.put("/change-password", verifyToken, changePasswordHandler);
profileRouter.delete("/delete-account", verifyToken, deleteAccountHandler);
profileRouter.get("/referral", verifyToken, getReferralSummaryHandler);

export default profileRouter;
    