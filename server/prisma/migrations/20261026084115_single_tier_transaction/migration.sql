/*
  Warnings:

  - The values [DONE,REJECTED,CANCELED] on the enum `TransactionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `eTicketId` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `ConfirmDeadline` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `discPrice` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `normalPrice` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `paymentProof` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `pointUsed` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the `ticketing` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `ticketId` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Made the column `saleStart` on table `ticket_type` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `priceAtPurchase` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticketTypeId` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TransactionStatus_new" AS ENUM ('WAITING_PAYMENT', 'WAITING_CONFIRM', 'PAID', 'CANCELLED', 'EXPIRED');
ALTER TABLE "public"."transactions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "transactions" ALTER COLUMN "status" TYPE "TransactionStatus_new" USING ("status"::text::"TransactionStatus_new");
ALTER TYPE "TransactionStatus" RENAME TO "TransactionStatus_old";
ALTER TYPE "TransactionStatus_new" RENAME TO "TransactionStatus";
DROP TYPE "public"."TransactionStatus_old";
ALTER TABLE "transactions" ALTER COLUMN "status" SET DEFAULT 'WAITING_PAYMENT';
COMMIT;

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_eTicketId_fkey";

-- DropForeignKey
ALTER TABLE "ticketing" DROP CONSTRAINT "ticketing_transactionId_fkey";

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "eTicketId",
ADD COLUMN     "ticketId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ticket_type" ALTER COLUMN "saleStart" SET NOT NULL;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "ConfirmDeadline",
DROP COLUMN "discPrice",
DROP COLUMN "normalPrice",
DROP COLUMN "paymentProof",
DROP COLUMN "pointUsed",
DROP COLUMN "totalPrice",
ADD COLUMN     "discountAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "priceAtPurchase" INTEGER NOT NULL,
ADD COLUMN     "ticketTypeId" TEXT NOT NULL,
ALTER COLUMN "quantity" DROP DEFAULT;

-- DropTable
DROP TABLE "ticketing";

-- CreateTable
CREATE TABLE "tickets" (
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

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticketCode_key" ON "tickets"("ticketCode");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_qrToken_key" ON "tickets"("qrToken");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_eventId_idx" ON "transactions"("eventId");

-- CreateIndex
CREATE INDEX "transactions_ticketTypeId_idx" ON "transactions"("ticketTypeId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "ticket_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
