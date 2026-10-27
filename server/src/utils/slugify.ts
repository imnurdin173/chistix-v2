import { randomBytes } from "node:crypto";
import { prisma } from "../config/prisma";

export function slugify(text: string): string {
  return text
    .toLowerCase() // 1. semua huruf kecil
    .trim() // 2. buang spasi di tepi
    .replace(/[^a-z0-9\s-]/g, "") // 3. buang semua kecuali huruf, angka, spasi, dash
    .replace(/\s+/g, "-") // 4. spasi (sekalipun berderet) jadi dash
    .replace(/-+/g, "-") // 5. dash berderet dirapatkan jadi satu
    .slice(0, 60) // 6. pangkas maksimal 60 karakter
    .replace(/^-+|-+$/g, ""); // 7. buang dash yang nyangkut di ujung
}

export async function generateUniqueEventSlug(title: string): Promise<string> {
  const base = slugify(title) || "event";

  for (let attempt = 0; attempt < 3; attempt++) {
    const suffix = randomBytes(2).toString("hex");
    const candidate = `${base}-${suffix}`;

    const ygSudahAda = await prisma.event.findUnique({
      where: { slug: candidate },
    });

    if (!ygSudahAda) {
      return candidate;
    }
  }
  return `${base}-${randomBytes(4).toString("hex")}`;
}
