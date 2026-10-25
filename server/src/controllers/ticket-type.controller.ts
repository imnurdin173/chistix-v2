import { Request, Response, NextFunction} from "express";
import { getEventParamSchema } from "../validations/event.validation";
import { createTicketTypeSchema } from "../validations/ticket-type.validation";
import * as ticketTypeService from "../services/ticket-type.service";
import { successResponse } from "../utils/response";

export const createTicketTypeHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try{
        const {id:eventId} = getEventParamSchema.parse(req.params);
        const data = createTicketTypeSchema.parse(req.body);

        const ticketType = await ticketTypeService.createTicketType(
            eventId,
            req.user!.id,
            data
        );
        return successResponse(res, 201, "Ticket Type has been created", ticketType);
    } catch (err) {
        next(err);
    }
}
