import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";// ⚠️ sesuaikan: kalau di auth.service kamu pakai "bcryptjs", ganti di sini

const prisma = new PrismaClient();

// helper: tanggal relatif dari "sekarang" — biar data dummy tak pernah kedaluwarsa
const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

async function main() {
  // ── 1. Organizer dummy (upsert = aman dijalankan berulang) ──
  
  const hashedPassword = await bcrypt.hash("Password123!", 10);
  const organizer = await prisma.user.upsert({
    where: { email: "organizer@chistix.test" },
    update: {}, // sudah ada? biarkan apa adanya
    create: {
      email: "organizer@chistix.test",
      password: hashedPassword,
      name: "Roxy The Organizer",
      role: "ORGANIZER",       // ⚠️ sesuaikan dengan sistem role di project kamu
      emailVerified: true,     // seeder mem-bypass verifikasi email
      referralCode: "Event-seed-01"
    },
  });
const hashedpassfaker = await bcrypt.hash("rahasia123",10);
    const orgfaker = await prisma.user.upsert({
    where: { email: "orgfake@thip-like.com" },
    update: {}, // sudah ada? biarkan apa adanya
    create: {
      email: "orgfake@thip-like.com",
      password: hashedpassfaker,
      name: "Org Faker",
      role: "ORGANIZER",       // ⚠️ sesuaikan dengan sistem role di project kamu
      emailVerified: true,     // seeder mem-bypass verifikasi email
      referralCode: "orgfaker-01"
    },
  });
  // ── 2. Bersihkan event dummy lama ──
  // Kenapa delete-then-create, bukan upsert? Event tidak punya unique key.
  // TicketType lama ikut terhapus otomatis — ingat onDelete: Cascade 😉
  await prisma.event.deleteMany({ where: { organizerId: organizer.id } });

  // ── 3. Event #1 — masih DRAFT ──
  const draftEvent = await prisma.event.create({
    data: {
      organizerId: organizer.id,
      title: "Chistix Jazz Night (DRAFT)",
      category: "MUSIC",
      description: "Deskripsi dummy untuk uji coba. Ganti kapan saja.",
      eventStartDate: daysFromNow(30),
      eventEndDate: daysFromNow(30),
      provinceId: "31",
      provinceName: "DKI Jakarta",
      cityId: "3171",
      cityName: "Kota Jakarta Pusat",
      venueAddress: "Jl. Dummy No. 1, Jakarta Pusat",
      thumbnailImage: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      coverImages: ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
      eventStatus: "DRAFT",
    },
  });

  // ── 4. Event #2 — PUBLISHED + 3 tier tiket (nested create!) ──
  const publishedEvent = await prisma.event.create({
    data: {
      organizerId: organizer.id,
      title: "Chistix Music Festival 2026",
      category: "MUSIC",
      description: "Festival dua hari dengan line-up dummy terbaik.",
      eventStartDate: daysFromNow(60),
      eventEndDate: daysFromNow(61),
      provinceId: "31",
      provinceName: "DKI Jakarta",
      cityId: "3171",
      cityName: "Kota Jakarta Pusat",
      venueAddress: "Jl. Festival No. 88, Jakarta Pusat",
      venueMapsUrl: "https://maps.google.com/?q=Jakarta+Pusat",
      thumbnailImage: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      coverImages: [
        "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        "https://res.cloudinary.com/demo/image/upload/sample2.jpg",
      ],
      eventStatus: "PUBLISHED",
      ticketTypes: {
        create: [ // nested write: 3 tier sekaligus dalam SATU panggilan
          { name: "Presale", priceNormal: 350000, priceAnchor: 450000, quota: 500, saleStart: daysFromNow(1), saleEnd: daysFromNow(14) },
          { name: "Regular", priceNormal: 500000, quota: 1000, saleStart: daysFromNow(1), saleEnd: daysFromNow(14) },
          { name: "VIP", priceNormal: 1500000, priceAnchor: 2000000, quota: 100, saleStart: daysFromNow(1), saleEnd: daysFromNow(14) },
        ],
      },
    },
  });

  // ===== VOUCHER DUMMY (dibuat sistem, bukan organizer) =====
await prisma.voucher.upsert({
  where: { code: "CHISTIX10" },
  update: {},
  create: {
    eventId: publishedEvent.id,   // ← sesuaikan: nama variabel event PUBLISHED di seeder-mu
    code: "CHISTIX10",
    discountType: "PERCENTAGE",
    discount: 10,                 // potongan 10%
    validStart: daysFromNow(0),
    validEnd: daysFromNow(30),
    maxUsage: 100,
  },
});

await prisma.voucher.upsert({
  where: { code: "HEMAT500K" },
  update: {},
  create: {
    eventId: publishedEvent.id,
    code: "HEMAT500K",
    discountType: "FIXED",
    discount: 500000,             // potongan Rp 500.000
    validStart: daysFromNow(0),
    validEnd: daysFromNow(30),
    maxUsage: 50,
  },
});

  console.log("✅ Seeder selesai:", { draftEvent: draftEvent.id, publishedEvent: publishedEvent.id });
}

main()
  .catch((e) => { console.error("❌ Seeder gagal:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());