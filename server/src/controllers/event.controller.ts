import type { Request, Response, NextFunction } from "express";
import {
  createEventSchema,
  getEventParamSchema,
  getEventsQuerySchema,
  updateEventSchema,
  eventIdOrSlugParamsSchema,
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
import {
  createVoucherSchema,
  updateVoucherSchema,
  voucherParamsSchema,
} from "../validations/voucher.validation";
import {
  createEventVoucher,
  listEventVouchers,
  updateEventVoucher,
  deleteEventVoucher,
} from "../services/voucher.service";

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
    const { id } = eventIdOrSlugParamsSchema.parse(req.params);
    const event = await getEventDetail(id);
    return successResponse(res, 200, "Detail event succesfully fetched /get", event);
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
  next: NextFunction,
) => {
  try {
    const { id } = getEventParamSchema.parse(req.params);
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
  next: NextFunction,
) => {
  try {
    const { id } = getEventParamSchema.parse(req.params);
    await deleteMyEvent(req.user!.id, id);
    return successResponse(res, 200, "Event deleted succesfully", null);
  } catch (err) {
    next(err);
  }
};

//voucher
export const createEventVoucherHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = getEventParamSchema.parse(req.params);
    const body = createVoucherSchema.parse(req.body);
    const voucher = await createEventVoucher(id, body, req.user!.id);
    return successResponse(res, 201, "Voucher Created Successfully", voucher);
  } catch (err) {
    next(err);
  }
};

export const getEventVouchersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const params = getEventParamSchema.parse(req.params);
    const { id } = getEventParamSchema.parse(req.params);
    const vouchers = await listEventVouchers(id, req.user!.id);
    return successResponse(res, 200, "Voucher fetched succesfully", vouchers);
  } catch (err) {
    next(err);
  }
};

export const updateEventVoucherHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const params = voucherParamsSchema.parse(req.params);
    const body = updateVoucherSchema.parse(req.body);
    const voucher = await updateEventVoucher(
      params.id,
      params.voucherId,
      body,
      req.user!.id,
    );
    return successResponse(res, 200, "Voucher Updated Successfully", voucher);
  } catch (err) {
    next(err);
  }
};

export const deleteEventVoucherHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const params = voucherParamsSchema.parse(req.params);
    const voucher = await deleteEventVoucher(
      params.id,
      params.voucherId,
      req.user!.id,
    );
    return successResponse(res, 200, "Voucher deleted succesfully", voucher);
  } catch (err) {
    next(err);
  }
};
