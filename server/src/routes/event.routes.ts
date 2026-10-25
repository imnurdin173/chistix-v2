import { Router } from "express";
import { verifyToken } from "../middlewares/auth.midleware";
import { requireOrganizer } from "../middlewares/event.middleware";
import { createEventHandler, getEventsHandler, getEventDetailHandler } from "../controllers/event.controller";

const router = Router();

router.post("/", verifyToken, requireOrganizer, createEventHandler);
router.get("/", getEventsHandler);
router.get("/:id", getEventDetailHandler);

export default router;