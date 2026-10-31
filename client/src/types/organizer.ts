import { EventTicketType, EventsPagination } from "./event";

export type OrganizerEventStatus = "DRAFT" | "UPCOMING" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "ENDED" | "CANCELLED";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ORGANIZER";
  referralCode: string;
  points: number;
  avatar: string | null;
}

export interface OrganizerEventItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  eventStartDate: string;
  eventEndDate: string;
  provinceId: string;
  provinceName: string;
  cityId: string;
  cityName: string;
  venueAddress: string;
  venueMapsUrl: string | null;
  thumbnailImage: string | null;
  coverImages: string[];
  videoUrl: string | null;
  eventStatus: OrganizerEventStatus;
  ticketTypes: EventTicketType[];
  dateText?: string;
  timeRangeText?: string;
}

export interface MyEventsResponse {
    events: OrganizerEventItem[]
    pagination: EventsPagination
}
