/*
  Warnings:

  - A unique constraint covering the columns `[lug]` on the table `event` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "event" ADD COLUMN     "lug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "event_lug_key" ON "event"("lug");
