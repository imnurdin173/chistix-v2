import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import {
  createTicketTypeInput,
  updateTicketTypeInput,
} from "../validations/ticket-type.validation";

export async function createTicketType(
  eventId: string,
  organizerId: string,
  data: createTicketTypeInput,
) {
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      organizerId: organizerId,
      deletedAt: null,
    },
  });
  if (!event) {
    throw new AppError("Event not Found", 404);
  }

  return prisma.ticketType.create({
    data: {
      ...data,
      eventId: eventId,
    },
  });
}

export async function getEventTicketTypes(
  eventId: string,
  organizerId: string,
) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null },
  });
  if (!event) throw new AppError("Event not found", 404);

  return prisma.ticketType.findMany({
    where: { eventId, deletedAt: null },
    orderBy: { priceNormal: "asc" },
  });
}

export async function updateTicketType(
  organizerId: string,
  eventId: string,
  ticketTypeId: string,
  data: updateTicketTypeInput,
) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null },
  });
  if (!event) throw new AppError("Event not found when you wanna update", 404);
  const existing = await prisma.ticketType.findFirst({
    where: { id: ticketTypeId, eventId, deletedAt: null },
  });
  if (!existing) throw new AppError("Ticket Types not found", 404);

  if (data.quota !== undefined && data.quota < existing.sold) {
    throw new AppError(`Quota cannot fewer than sold (${existing.sold})`, 400);
  }

  const newPriceNormal = data.priceNormal ?? existing.priceNormal;
  const newPriceAnchor =
    data.priceAnchor === undefined ? existing.priceAnchor : data.priceAnchor;

  if (newPriceAnchor !== null && newPriceAnchor <= newPriceNormal) {
    throw new AppError("Price ANchor must be bigger than Price Normal", 400);
  }

  const newSaleStart = data.saleStart ?? existing.saleStart;
  const newSaleEnd =
    data.saleEnd === undefined ? existing.saleEnd : data.saleEnd;
  if (newSaleStart && newSaleEnd && newSaleEnd < newSaleStart) {
    throw new AppError("saleEndDate must before saleStartDate", 400);
  }
  return prisma.ticketType.update({ where: { id: existing.id }, data });
}

export async function deleteTicketType(
    organizerId: string,
    eventId: string,
    ticketTypeId:string
) {
    const event = await prisma.event.findFirst({
        where: {id: eventId, organizerId, deletedAt:null}
    });
    if (!event) throw new AppError("Event not found ", 404);

    const existing = await prisma.ticketType.findFirst({
        where: {id:ticketTypeId, eventId, deletedAt:null}
    });
    if(!existing) throw new AppError("Ticket type not found", 404);

    return prisma.ticketType.update({
        where:{id: existing.id},
        data: {deletedAt: new Date() }
    });
}