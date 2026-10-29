Cara Menggunakannya di Server Component & Middleware
Saat kamu mendeteksi pelanggaran hak akses atau bentrok data di backend/Server Component, kamu tinggal melakukan pengalihan (redirect):

1. Di Middleware / Server Action (Proteksi Role 403):

TypeScript
import { redirect } from "next/navigation";

// Jika Customer mencoba masuk ke dashboard Organizer
if (user.role !== "ORGANIZER") {
  redirect("/error/403");
} else {
  asdsdddd
}


2. Saat Registrasi / Beli Tiket Ganda (Conflict 409):

TypeScript
if (isTicketAlreadyBooked) {
  redirect("/error/409");
}