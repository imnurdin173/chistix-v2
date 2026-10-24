import { Request, Response, NextFunction } from "express";
import Jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";   
import { jwt } from "zod";
import { errorResponse } from "../utils/response";

interface AuthPayload {
    id: string;
    role:string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse(res, 401, "Token tidak ditemukan, silakan login terlebih dahulu");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = Jwt.verify(token, env.jwtSecret) as {
      id: string;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch {
    return errorResponse(res, 401, "Token tidak valid atau sudah kedaluwarsa");
  }
};