/*
  Warnings:

  - You are about to drop the column `lug` on the `event` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `event` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "event_lug_key";

-- AlterTable
ALTER TABLE "event" DROP COLUMN "lug",
ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "event_slug_key" ON "event"("slug");
