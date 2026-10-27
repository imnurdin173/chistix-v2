import { Router } from "express";
import * as transactionController from '../controllers/transaction.controller';
import { verifyToken, authorize } from "../middlewares/auth.midleware";

const router = Router();

// router.post('/', verifyToken, authorize('USER'), transactionController.createTransactionHandler);
router.post('/', verifyToken, transactionController.createTransactionHandler);

export default router;