import { Router } from "express";
import {
  createReviewHandler,
  getEventReviewsHandler,
} from "../controllers/review.controller";
import { verifyToken } from "../middlewares/auth.midleware";

const router = Router();

router.get("/:eventId/reviews", getEventReviewsHandler);
router.post("/:eventId/reviews", verifyToken, createReviewHandler);

export default router;
