import { Request, Response, NextFunction } from "express";
import {
  createTransactionSchema,
  listTransactionsQuerySchema,
  transactionParamsSchema,
} from "../validations/transaction.validation";
import * as transactionService from "../services/transaction.service";
import { successResponse } from "../utils/response";
import { createSnapTransaction } from "../utils/midtrans";
import { AppError } from "../utils/AppError";

export const createTransactionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = createTransactionSchema.parse(req.body);
    const userId = (req as any).user.id;

    const transaction = await transactionService.createTransaction({
      userId,
      ticketTypeId: body.ticketTypeId,
      quantity: body.quantity,
      voucherCode: body.voucherCode
    });

    const grossAmount =
      transaction.quantity * transaction.priceAtPurchase -
      transaction.discountAmount;

    const snap = await createSnapTransaction({
      orderId: transaction.id,
      grossAmount,
      customerEmail: req.user!.email,
    });

    return successResponse(res, 201, "Transaction has been created", {
      ...transaction,
      totalPrice: grossAmount,
      paymentUrl: snap.redirect_url,
    });
  } catch (err) {
    next(err);
  }
};

export const listMyTransactionsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if(!req.user) {
      throw new AppError("Please login first", 401);
    }
    
    const userId = req.user.id;
    const query = listTransactionsQuerySchema.parse(req.query);
    const data = await transactionService.listMyTransactions(
      userId,
      query,
    );
    return successResponse(
      res,
      200,
      "Transaction list succesfully created",
      data,
    );
  } catch (err) {
    next(err);
  }
};

export const getTransactionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if(!req.user) {
      throw new AppError("Please login first", 401);
    }
    const userId = req.user.id;   
    const params = transactionParamsSchema.parse(req.params);
    const data = await transactionService.getTransactionDetail(
      userId,
      params.id,
    );
    return successResponse(
      res,
      200,
      "Transaction sucessfully retrieved!, selamet yee",
      data,
    );
  } catch (err) {
    next(err);
  }
};

export const cancelTransactionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if(!req.user) {
      throw new AppError("Please login first", 401);
    }
    const userId = req.user.id;   
    const params = transactionParamsSchema.parse(req.params);
    const data = await transactionService.cancelTransaction(
      userId,
      params.id,
    );
    return successResponse(
      res,
      200,
      "Transaction successfully cancelled",
      data,
    );
  } catch (err) {
    next(err);
  }
};
