import { Router } from "express";
import * as transactionController from '../controllers/transaction.controller';
import { verifyToken, authorize } from "../middlewares/auth.midleware";

const router = Router();

// router.post('/', verifyToken, authorize('USER'), transactionController.createTransactionHandler);
router.post('/', verifyToken, transactionController.createTransactionHandler);
router.get("/", verifyToken, transactionController.listMyTransactionsHandler );
router.get("/:id", verifyToken, transactionController.getTransactionHandler);
router.post("/:id/cancel", verifyToken, transactionController.cancelTransactionHandler);

export default router;