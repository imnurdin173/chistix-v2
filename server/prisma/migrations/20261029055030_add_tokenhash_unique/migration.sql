/*
  Warnings:

  - You are about to drop the column `usetAt` on the `passwordResetToken` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tokenHash]` on the table `passwordResetToken` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "passwordResetToken" DROP COLUMN "usetAt",
ADD COLUMN     "usedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "passwordResetToken_tokenHash_key" ON "passwordResetToken"("tokenHash");
