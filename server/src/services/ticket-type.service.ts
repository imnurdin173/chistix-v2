import  {prisma} from "../config/prisma";
import { AppError } from "../utils/AppError";
import { createTicketTypeInput } from "../validations/ticket-type.validation";

export async function createTicketType(
    eventId: string,
    organizerId: string,
    data: createTicketTypeInput
) {
    const event = await prisma.event.findFirst({
        where: {
            id: eventId,
            organizerId: organizerId,
            deletedAt: null
        },
    });
    if(!event) {
        throw new AppError("Event not Found",404);
    }

    return prisma.ticketType.create({
        data: {
            ...data,
            eventId: eventId,
        }
    })
}