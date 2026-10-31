// Ticket data needed by the cart page (translated from the backend event data)
export type CartTicket = {
  ticketTypeId: string;
  eventSlug: string;
  eventTitle: string;
  organizerName: string;
  ticketName: string;
  price: number;
  remaining: number;
};