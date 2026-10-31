// value MUST match the EventCategory enum in the backend (schema.prisma)
export const EVENT_CATEGORIES = [
  { value: "MUSIC", label: "Music" },
  { value: "SEMINAR", label: "Seminar" },
  { value: "TALKSHOW", label: "Talkshow" },
  { value: "ARTS_THEATRE", label: "Arts & Theatre" },
  { value: "SPORTS", label: "Sports" },
  { value: "COMMUNITY", label: "Community" },
  { value: "EXHIBITION", label: "Exhibition" },
  { value: "OTHER", label: "Other" },
];

// "ARTS_THEATRE" → "Arts & Theatre"
export function getCategoryLabel(value: string): string {
  return EVENT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}