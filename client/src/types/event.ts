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
  saleEnd: string;
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