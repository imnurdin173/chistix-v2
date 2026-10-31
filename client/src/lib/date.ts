const TIME_ZONE = "Asia/Jakarta";

function formatDay(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: TIME_ZONE });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE });
}

// "25 October 2026, 22:11 – 22:12 WIB" (same day)
// "25 December 2026, 19:00 – 26 December 2026, 23:00 WIB" (multi-day)
export function formatEventSchedule(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const startDay = formatDay(start);
  const endDay = formatDay(end);

  return startDay === endDay
    ? `${startDay}, ${formatTime(start)} – ${formatTime(end)} WIB`
    : `${startDay}, ${formatTime(start)} – ${endDay}, ${formatTime(end)} WIB`;
}