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

export const suggestEvents = async (q: string) => {
  const rows = await prisma.event.findMany({
    where: {
      deletedAt: null,
      OR: [
        {title: {contains: q, mode: "insensitive"}},
        {organizer: {name: {contains: q, mode: "insensitive"}}},
      ],
    },
    select: {id: true, title: true, slug: true, cityName: true},
    take: 8,
    orderBy: {title: "asc"}
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    city: r.cityName,
  }));
};

export const browseEvents = async (q?: string) => {
  return prisma.event.findMany({
    where: q? {
      OR: [
        {title: {contains:q, mode: "insensitive"}},
        {organizer: {name: {contains: q, mode: "insensitive"}}},
      ],
    }
    : undefined,
    select: {
      id: true,
      title: true,
      slug: true,
      organizer: {select: {name:true}},
    },
    orderBy: {title: "asc"},
  });
};

export const getMyAttendees = async (organizerId: string) => {
  const myEvents = await prisma.event.findMany({
    where: { organizerId, deletedAt: null },
    select: { id: true },
  });

  const eventIds = myEvents.map((e) => e.id);
  if (eventIds.length === 0) return [];

  const tickets = await prisma.tickets.findMany({
    where: {
      deletedAt: null,
      transaction: {
        eventId: { in: eventIds },
        status: "PAID",
        deletedAt: null,
      },
    },
    include: {
      transaction: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          ticketType: {
            select: {
              id: true,
              name: true,
              priceNormal: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return tickets.map((t) => ({
    id: t.id,
    ticketCode: t.ticketCode,
    isAttended: t.isAttended,
    attendedAt: t.attendedAt,
    transactionId: t.transactionId,
    eventId: t.transaction.eventId,
    eventName: t.transaction.event.title,
    ticketTier: t.transaction.ticketType.name,
    customerName: t.transaction.user.name,
    customerEmail: t.transaction.user.email,
    customerAvatar: t.transaction.user.avatar,
    purchasedAt: t.transaction.createdAt,
    price: t.transaction.ticketType.priceNormal,
  }));
};

export const getMyOrganizerTransactions = async (
  organizerId: string,
  query: {
    status?: string;
    eventId?: string;
    page: number;
    limit: number;
  }
) => {
  const { status, eventId, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    deletedAt: null,
    event: {
      organizerId,
      deletedAt: null,
      ...(eventId && eventId !== "ALL" ? { id: eventId } : {}),
    },
    ...(status && status !== "ALL" ? { status } : {}),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            category: true,
            thumbnailImage: true,
          },
        },
        ticketType: {
          select: {
            id: true,
            name: true,
            priceNormal: true,
          },
        },
        voucher: {
          select: {
            id: true,
            code: true,
          },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions: transactions.map((t) => ({
      ...t,
      totalPrice:
        t.quantity * t.priceAtPurchase -
        t.discountAmount -
        t.couponAmount -
        (t.pointsUsed || 0),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};