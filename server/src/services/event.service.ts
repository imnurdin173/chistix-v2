import { prisma } from "../config/prisma";
import { Prisma } from "@prisma/client";
import type {
  createEventInput,
  updateEventInput,
  getEventQuery,
} from "../validations/event.validation";
import { AppError } from "../utils/AppError";
import { generateUniqueEventSlug } from "../utils/slugify";

// export const createEvent = async (
//   data: createEventInput,
//   organizerId: string,
// ) => {
//   return prisma.event.create({
//     data: {
//       ...data,
//       organizerId,
//     },
//   });
// };

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const createEvent = async (data: createEventInput, organizerId: string) => {
  const slug = await generateUniqueEventSlug(data.title);

  return prisma.event.create({
    data: { ...data, slug, organizerId },
  });
};

export const getPublishedEvents = async (query: getEventQuery) => {
  const { page, limit, category, search } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.EventWhereInput = {
    eventStatus: "PUBLISHED",
    deletedAt: null,
    eventEndDate: { gte: new Date() },
    ...(category && { category }),
    ...(search && { title: { contains: search, mode: "insensitive" } }),
  };

  const [events, total] = await prisma.$transaction([
    prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy: { eventStartDate: "asc" },
      include: {
        ticketTypes: {
          where: { deletedAt: null },
          orderBy: { priceNormal: "asc" },
        },
        organizer: { select: { id: true, name: true } },
      },
    }),
    prisma.event.count({ where }),
  ]);

  return {
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getEventDetail = async (id: string) => {
  // const event = await prisma.event.findFirst({
  //   where: {
  //     id,
  //     deletedAt: null,
  //     eventStatus: "PUBLISHED",
  //   },
  //   include: {
  //     ticketTypes: {
  //       where: { deletedAt: null },
  //       orderBy: { priceNormal: "asc" },
  //     },
  //     organizer: { select: { id: true, name: true } },
  //   },
  // });

  const event = await prisma.event.findFirst({
    where: UUID_REGEX.test(id) ? { id } : { slug: id },
    include: {
      ticketTypes: {
        where: { deletedAt: null },
        orderBy: { priceNormal: "asc" },
      },
      organizer: { select: { id: true, name: true } },
    },
  });

  if (!event) {
    throw new AppError("Event not Found", 404);
  }
  return event;
};

export const getMyEvents = async (
  organizerId: string,
  query: getEventQuery,
) => {
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.EventWhereInput = {
    organizerId,
    deletedAt: null,
  };

  const [events, total] = await prisma.$transaction([
    prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        ticketTypes: {
          where: { deletedAt: null },
          orderBy: { priceNormal: "asc" },
        },
      },
    }),
    prisma.event.count({ where }),
  ]);
  return {
    events,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const updateMyEvent = async (
  organizerId: string,
  eventId: string,
  data: updateEventInput,
) => {
  const existing = await prisma.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null },
  });
  if (!existing) {
    throw new AppError("Event not Found", 404);
  }

  if (data.eventStartDate || data.eventEndDate) {
    const start = data.eventStartDate ?? existing.eventStartDate;
    const end = data.eventEndDate ?? existing.eventEndDate;
    if (end < start) {
      throw new AppError("End Date cannot be set before Start Date", 400);
    }
  }
  return prisma.event.update({ where: { id: existing.id }, data });
};

export const deleteMyEvent = async (organizerId: string, eventId: string) => {
  const existing = await prisma.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null },
  });
  if (!existing) {
    throw new AppError("Event not Found", 404);
  }
  return prisma.event.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });
};
