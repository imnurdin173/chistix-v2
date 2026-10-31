// Mirror subset response GET /api/events.
// Backend punya lebih banyak field — yang tidak dipakai homepage tidak perlu dideklarasikan.

export interface EventTicketType {
  id: string;
  name: string;
  priceNormal: number;
  priceAnchor: number | null;
  quota: number;
  sold: number;
  saleStart: string;
  saleEnd: string | null;
}

export interface EventOrganizer {
  id: string;
  name: string;
}

export interface EventListItem {
  id: string;
  title: string;
  category: string;
  description: string;
  eventStartDate: string;
  eventEndDate: string;
  provinceName: string;
  cityName: string;
  venueAddress: string;
  thumbnailImage: string | null;
  slug: string;
  eventStatus: string;
  ticketTypes: EventTicketType[];
  organizer: EventOrganizer;
}

export interface EventsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EventsResponse {
  events: EventListItem[];
  pagination: EventsPagination;
}

// Detail endpoint returns more fields than the list
export interface EventDetail extends EventListItem {
  venueMapsUrl: string | null;
  coverImages: string[];
  deletedAt: string | null;
}

export type TicketStatus = "AVAILABLE" | "NOT_STARTED" | "ENDED" | "SOLD_OUT";

// Ticket data prepared by the server for the ticket panel
export interface TicketOption {
  id: string;
  name: string;
  price: number;
  priceAnchor: number | null;
  remaining: number;
  status: TicketStatus;
}