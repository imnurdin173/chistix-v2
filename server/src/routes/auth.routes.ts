import { Router } from "express";
import { registerHandler, loginHandler, googleLoginHandler, meHandler, verifyEmailHandler, resendVerificationHandler, forgotPasswordHandler, resetPasswordHandler } from "../controllers/auth.controller";
import { verifyToken } from "../middlewares/auth.midleware";
import { resendSchema } from "../validations/auth.validation";

const authRouter = Router();

authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);
authRouter.post("/google", googleLoginHandler);
authRouter.get("/me", verifyToken, meHandler);
// authRouter.get("/test-email", testEmailHandler);
authRouter.get("/verify-email", verifyEmailHandler);
authRouter.post("/resend-verification", resendVerificationHandler);
authRouter.post("/forgot-password", forgotPasswordHandler);
authRouter.post("/reset-password", resetPasswordHandler);

export default authRouter;