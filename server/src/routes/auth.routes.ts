import { Router } from "express";
import { registerHandler, loginHandler, googleLoginHandler } from "../controllers/auth.controller";

const authRouter = Router();

authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);
authRouter.post("/google", googleLoginHandler);

export default authRouter;