import type { Request, Response, NextFunction } from "express";
import {
  createEventSchema,
  getEventParamSchema,
  getEventsQuerySchema,
  updateEventSchema,
} from "../validations/event.validation";
import {
  createEvent,
  getMyEvents,
  getPublishedEvents,
  getEventDetail,
  updateMyEvent,
  deleteMyEvent,
} from "../services/event.service";
import { successResponse } from "../utils/response";

export const createEventHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = createEventSchema.parse(req.body);
    const event = await createEvent(data, req.user!.id);
    return successResponse(res, 201, "Event has been created as Draft", event);
  } catch (err) {
    next(err);
  }
};

export const getEventsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = getEventsQuerySchema.parse(req.query);
    const { events, pagination } = await getPublishedEvents(query);
    return successResponse(res, 200, "Data Event succesfully taken", {
      events,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};

export const getEventDetailHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = getEventParamSchema.parse(req.params);
    const event = await getEventDetail(id);
    return successResponse(res, 200, "Detail event succesfully taken", event);
  } catch (err) {
    next(err);
  }
};

export const getMyEventsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = getEventsQuerySchema.parse(req.query);
    const data = await getMyEvents(req.user!.id, query);
    return successResponse(
      res,
      200,
      "Your Data event has succefully taken",
      data,
    );
  } catch (err) {
    next(err);
  }
};

export const updateMyEventHandler = async (
    req: Request, 
    res: Response,
    next:NextFunction
) => {
    try {
        const {id} = getEventParamSchema.parse(req.params);
        const data = updateEventSchema.parse(req.body);
        const event = await updateMyEvent(req.user!.id, id, data);
        return successResponse(res, 200, "Event sucessfully updated", event);
    } catch (err) {
        next(err);
    }
};

export const deleteMyEventHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
    const {id} = getEventParamSchema.parse(req.params);
    await deleteMyEvent(req.user!.id, id);
    return successResponse(res, 200, "Event deleted succesfully", null);
} catch (err) {
    next(err);
}
};