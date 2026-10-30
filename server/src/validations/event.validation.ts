import z from "zod";
import { EventCategory } from "@prisma/client";

export const eventBaseSchema = z.object({
  title: z.string().min(3, "Please input Title minimum 3 Character ").max(150),
  category: z.enum(EventCategory),
  description: z.string().min(30, "Description minimum 30 Character"),
  eventStartDate: z.coerce.date(),
  eventEndDate: z.coerce.date(),
  provinceId: z.string().min(1, "Province must be choosen"),
  provinceName: z.string().min(1),
  cityId: z.string().min(1, "City must be choosen"),
  cityName: z.string().min(1),
  venueAddress: z.string().min(5, "Venue Address must be clearly valid"),
  venueMapsUrl: z.url("URL Maps tidak valid").optional(),
  thumbnailImage: z.url("Thumbnail is not right"),
  coverImages: z.array(z.url()).default([]),
  videoUrl: z.url().optional(),
  scheduledPublishStart: z.coerce.date().optional(),
  scheduledPublishEnd: z.coerce.date().optional(),
});

export const createEventSchema = eventBaseSchema.refine(
  (data) => data.eventEndDate >= data.eventStartDate,
  {
    message: "End Date Cannot set before Start Date",
    path: ["eventEndDate"],
  },
);

// export const createEventSchema = z.object({
//     title: z.string().min(3, "Please input Title minimum 3 Character ").max(150),
//     category: z.enum(EventCategory),
//     description: z.string().min(30, "Description minimum 30 Character"),
//     eventStartDate: z.coerce.date(),
//     eventEndDate: z.coerce.date(),
//     provinceId: z.string().min(1, "Province must be choosen"),
//     provinceName: z.string().min(1),
//     cityId: z.string().min(1, "City must be choosen"),
//     cityName: z.string().min(1),
//     venueAddress: z.string().min(5, "Venue Address must be clearly valid"),
//     venueMapsUrl: z.url("URL Maps tidak valid").optional(),
//     thumbnailImage: z.url("Thumbnail is not right"),
//     coverImages: z.array(z.url()).default([]),
//     videoUrl: z.url().optional(),
//     scheduledPublishStart: z.coerce.date().optional(),
//     scheduledPublishEnd: z.coerce.date().optional()
// })
// .refine((data) => data.eventEndDate >=  data.eventStartDate, {
//     message: "Please enter the correct Date",
//     path: ["eventEndDate"]
// });

export type createEventInput = z.infer<typeof createEventSchema>;

export const getEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(9),
  category: z.enum(EventCategory).optional(),
  search: z.string().trim().min(1).optional(),
});
export type getEventQuery = z.infer<typeof getEventsQuerySchema>;

export const getEventParamSchema = z.object({
  id: z.uuid({ message: "ID event is not valid format" }),
});

export const eventIdOrSlugParamsSchema = z.object({
  id: z.string().min(1),
});

export const updateEventSchema = eventBaseSchema.partial().extend({
  coverImages: z.array(z.url()).optional(),
});

export type updateEventInput = z.infer<typeof updateEventSchema>;
