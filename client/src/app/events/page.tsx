//tempat customer melihat detail event dan targetnya pindah ke cart

import { redirect } from "next/navigation";

// The event list lives at /browse
export default function EventsPage() {
  redirect("/browse");
}