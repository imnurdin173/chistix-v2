import { Request, Response, NextFunction } from "express";
import { createReview, getEventReviews } from "../services/review.service";
import { createReviewSchema, getReviewsQuerySchema } from "../validations/review.validation";
import { successResponse } from "../utils/response";
import { create } from "node:domain";

export const getEventReviewsHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const query = getReviewsQuerySchema.parse(req.query);
        const eventId = req.params.eventId as string;
        const data = await getEventReviews(eventId, query);
        return successResponse(res, 200, "Review has succesfully retrieved", data);
    } catch (err) {
        next(err);
    }
};

export const createReviewHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const body = createReviewSchema.parse(req.body);
        // const eventId = req.params.eventId as string;
        const data = await createReview(req.user!.id, req.params.eventId as string, body);
        return successResponse(res, 201, "Thank you, your review has been saved", data);
    } catch (err) {
        next(err);
    }
}