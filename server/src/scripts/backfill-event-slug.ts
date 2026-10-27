// import "dotenv/config";
import dotenv from 'dotenv';
dotenv.config();

import { prisma } from "../config/prisma";
import { generateUniqueEventSlug } from "../utils/slugify";

async function main() {
  const events = await prisma.event.findMany({
    where: { slug: null },
    select: { id: true, title: true },
  });

  console.log(`Menemukan ${events.length} event tanpa slug.`);

  for (const event of events) {
    const slug = await generateUniqueEventSlug(event.title);
    await prisma.event.update({
      where: { id: event.id },
      data: { slug },
    });
    console.log(`${event.title}  →  ${slug}`);
  }

  console.log("Backfill selesai!");
}

main()
  .catch((err) => {
    console.error("Backfill gagal:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());