import { Request, Response } from "express";
import { successResponse } from "../utils/response";

export const getHealth = async (_req: Request, res: Response) => {
    successResponse(res, 200, "API is WOrks");
};