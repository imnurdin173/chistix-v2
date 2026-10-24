import { Router } from "express";
import { registerHandler, loginHandler, googleLoginHandler, meHandler, testEmailHandler, verifyEmailHandler } from "../controllers/auth.controller";
import { verifyToken } from "../middlewares/auth.midleware";

const authRouter = Router();

authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);
authRouter.post("/google", googleLoginHandler);
authRouter.get("/me", verifyToken, meHandler);
authRouter.get("/test-email", testEmailHandler);
authRouter.get("/verify-email", verifyEmailHandler);
export default authRouter;