import { Router } from "express";
import { verifyToken } from "../middlewares/auth.midleware";
import { requireOrganizer } from "../middlewares/event.middleware";
import { createEventHandler, getEventsHandler, getEventDetailHandler, getEventVouchersHandler, createEventVoucherHandler, updateEventVoucherHandler, deleteEventVoucherHandler } from "../controllers/event.controller";
import { createTicketTypeHandler, getEventTicketTypesHandler,updateTicketTypeHandler, deleteTicketTypeHandler } from "../controllers/ticket-type.controller";
const router = Router();

router.post("/", verifyToken, requireOrganizer, createEventHandler);
router.get("/", getEventsHandler);
router.get("/:id", getEventDetailHandler);
router.post("/:id/ticket-types", verifyToken, requireOrganizer, createTicketTypeHandler);
router.post("/:id/vouchers", verifyToken, requireOrganizer, createEventVoucherHandler);
router.get('/:id/vouchers', verifyToken, requireOrganizer, getEventVouchersHandler);
router.put('/:id/vouchers/:voucherId', verifyToken, requireOrganizer, updateEventVoucherHandler);
router.delete('/:id/vouchers/:voucherId', verifyToken, requireOrganizer, deleteEventVoucherHandler);
router.get("/:id/ticket-types", verifyToken, requireOrganizer, getEventTicketTypesHandler);
router.put("/:id/ticket-types/:ticketTypeId", verifyToken, requireOrganizer, updateTicketTypeHandler);
router.delete("/:id/ticket-types/:ticketTypeId", verifyToken, requireOrganizer, deleteTicketTypeHandler );

export default router;