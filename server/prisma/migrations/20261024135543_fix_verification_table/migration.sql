/*
  Warnings:

  - You are about to drop the column `identifier` on the `verification` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `verification` table. All the data in the column will be lost.
  - You are about to drop the `ETicket` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[token]` on the table `verification` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `token` to the `verification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `verification` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ETicket" DROP CONSTRAINT "ETicket_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_eTicketId_fkey";

-- DropIndex
DROP INDEX "verification_identifier_idx";

-- AlterTable
ALTER TABLE "verification" DROP COLUMN "identifier",
DROP COLUMN "value",
ADD COLUMN     "token" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "ETicket";

-- CreateTable
CREATE TABLE "ticketing" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "ticketCode" TEXT NOT NULL,
    "isAttended" BOOLEAN NOT NULL DEFAULT false,
    "attendedAt" TIMESTAMP(3),
    "qrToken" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ticketing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ticketing_ticketCode_key" ON "ticketing"("ticketCode");

-- CreateIndex
CREATE UNIQUE INDEX "ticketing_qrToken_key" ON "ticketing"("qrToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_key" ON "verification"("token");

-- AddForeignKey
ALTER TABLE "verification" ADD CONSTRAINT "verification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticketing" ADD CONSTRAINT "ticketing_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_eTicketId_fkey" FOREIGN KEY ("eTicketId") REFERENCES "ticketing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
