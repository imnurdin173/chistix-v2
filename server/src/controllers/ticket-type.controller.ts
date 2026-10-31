import { Request, Response, NextFunction} from "express";
import { getEventParamSchema } from "../validations/event.validation";
import { createTicketTypeSchema, ticketTypeParamsSchema, updateTicketTypeSchema } from "../validations/ticket-type.validation";
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



export const getEventTicketTypesHandler= async (
    req:Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id: eventId} = getEventParamSchema.parse(req.params);
        const ticketTypes = await ticketTypeService.getEventTicketTypes(eventId, req.user!.id);
        return successResponse(res, 200, "Ticket Type List succesfully selected", ticketTypes);
    } catch (err) {
        next(err);
    }
}

export const updateTicketTypeHandler = async (
    req:Request,
    res:Response,
    next:NextFunction
) => {
    try {
        const { id: eventId, ticketTypeId} = ticketTypeParamsSchema.parse(req.params);
        const data = updateTicketTypeSchema.parse(req.body);
        const ticketType = await ticketTypeService.updateTicketType(
            req.user!.id, eventId, ticketTypeId, data
        );
        return successResponse(res, 200, "Ticket ttypes sucessfully updated", ticketType);
    } catch (err) {
        next(err);
    }
}

export const deleteTicketTypeHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {id: eventId, ticketTypeId} = ticketTypeParamsSchema.parse(req.params);
        const ticketType = await ticketTypeService.deleteTicketType(req.user!.id, eventId, ticketTypeId);
        return successResponse(res, 200, "TIcket types succesfully deleted", ticketType);
    } catch (err) {
        next(err);
    }
}
