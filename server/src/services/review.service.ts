import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { CreateReviewBody, GetReviewsQuery } from "../validations/review.validation";
import { AppError } from "../utils/AppError";

export const getEventReviews = async (
  eventId: string,
  query: GetReviewsQuery,
) => {
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.ReviewWhereInput = {
    eventId,
    deletedAt: null,
  };

  const [reviews, total, agg] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    }),
    prisma.review.count({ where }),
    prisma.review.aggregate({
      where,
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  return {
    reviews,
    ratingSummary: {
      average: agg._avg.rating ?? 0,
      total: agg._count._all,
    },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const createReview = async (
    userId: string,
    eventId: string,
    body: CreateReviewBody
) => {
    const event = await prisma.event.findFirst({
        where: {id: eventId,
            deletedAt: null}
        })
        if (!event) throw new AppError("Event tidak ditemukan", 404);
        
        const reviewOpened = ["COMPLETED", "ENDED"].includes(event.eventStatus);
        if(!reviewOpened) {
            throw new AppError("You can Review after event has been finished", 403);
        }

        const buktiStamp = await prisma.tickets.findFirst({
            where: {
                deletedAt: null,
                isAttended: true,
                transaction: {
                    userId,
                    eventId,
                    status: "PAID",
                    deletedAt: null,
                },
            },
        });
    if(!buktiStamp) {
        throw new AppError("Sabar wir, Please checkin at event first ",403);
    }

    const existing = await prisma.review.findUnique({
        where: {eventId_userId: {eventId, userId}}
    });

    return prisma.$transaction(async (tx) => {
        const data = {
            rating: body.rating,
            reviewDesc: body.reviewDesc,
            deletedAt: null
        };

        return existing
        ? tx.review.update({where: {id: existing.id}, data})
        : tx.review.create({data: { ...data, eventId, userId}});
    });
};