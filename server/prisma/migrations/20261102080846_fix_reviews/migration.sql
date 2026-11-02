/*
  Warnings:

  - You are about to drop the column `orgReply` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `orgReplyAt` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `ratingScore` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `reviewCustomerAt` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `ticketId` on the `reviews` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[eventId,userId]` on the table `reviews` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `rating` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_ticketId_fkey";

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "orgReply",
DROP COLUMN "orgReplyAt",
DROP COLUMN "ratingScore",
DROP COLUMN "reviewCustomerAt",
DROP COLUMN "ticketId",
ADD COLUMN     "rating" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "pointsUsed" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "reviews_eventId_userId_key" ON "reviews"("eventId", "userId");
