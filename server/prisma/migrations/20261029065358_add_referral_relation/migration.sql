-- AlterTable
ALTER TABLE "user" ADD COLUMN     "referredById" TEXT;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
