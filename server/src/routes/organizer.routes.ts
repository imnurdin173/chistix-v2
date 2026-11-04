import { Router } from "express";
import { verifyToken } from "../middlewares/auth.midleware";
import { requireOrganizer } from "../middlewares/event.middleware";
import { deleteMyEventHandler, getMyEventsHandler, updateMyEventHandler, getMyAttendeesHandler,getMyOrganizerTransactionsHandler } from "../controllers/event.controller";

const router = Router();

router.get("/my-events",verifyToken, requireOrganizer, getMyEventsHandler);
router.put("/my-events/:id", verifyToken, requireOrganizer, updateMyEventHandler);
router.delete("/my-events/:id", verifyToken, requireOrganizer, deleteMyEventHandler);
router.get("/attendees", verifyToken, requireOrganizer, getMyAttendeesHandler);
router.get("/transactions", verifyToken, requireOrganizer, getMyOrganizerTransactionsHandler);

export default router;