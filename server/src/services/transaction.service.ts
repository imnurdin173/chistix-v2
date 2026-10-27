import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { PAYMENT_DEADLINE_MINUTES } from "../utils/constants";

const payment_deadline_minutes = PAYMENT_DEADLINE_MINUTES ;

interface createTransactionInput {
    userId: string;
    ticketTypeId: string;
    quantity: number;
}

export async function createTransaction(input: createTransactionInput) {
    return prisma.$transaction(async (tx) => {

        const ticketType = await tx.ticketType.findFirst({
            where: {id: input.ticketTypeId, deletedAt: null},
            include: {event:true}
        });

        if(!ticketType) {
            throw new AppError('TIcket Type is not fouind', 404);
        }

        if(ticketType.event.deletedAt) {
            throw new AppError('Events is not available anymore to transaction dude', 404);
        }

        const now = new Date();
        if (now < ticketType.saleStart) {
            throw new AppError('ticket sales not open yet bro, still dreaming ', 409);
        }

        if(ticketType.saleEnd && now > ticketType.saleEnd) {
            throw new AppError('icket sales has been closed ma bro', 409);
        }

        const remaining = ticketType.quota - ticketType.sold;
        if(input.quantity > remaining) {
            throw new AppError(`Quota is Beak you know, just ${remaining} remaining ticket `, 409);
        }

        await tx.ticketType.update({
            where: {id: ticketType.id},
            data: {sold: {increment: input.quantity}}
        });

        const transaction = await tx.transaction.create({
            data: {
                userId: input.userId,
                eventId: ticketType.eventId,
                ticketTypeId: ticketType.id,
                quantity: input.quantity,
                priceAtPurchase: ticketType.priceNormal,
                paymentDeadline: new Date(now.getTime()+ payment_deadline_minutes*60*1000)
            },
            include: {event:true, ticketType: true}
        });

        return {
            ...transaction,
            totalPrice:
            transaction.quantity*transaction.priceAtPurchase - transaction.discountAmount,
        };
    });
}