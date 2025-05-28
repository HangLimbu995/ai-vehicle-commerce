/*
  Warnings:

  - Changed the type of `dayOfWeek` on the `WorkingHour` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- AlterTable
ALTER TABLE "TestDriveBooking" ALTER COLUMN "bookingDate" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "WorkingHour" DROP COLUMN "dayOfWeek",
ADD COLUMN     "dayOfWeek" "DayOfWeek" NOT NULL;

-- DropEnum
DROP TYPE "dayOfWeek";

-- CreateIndex
CREATE INDEX "WorkingHour_dayOfWeek_idx" ON "WorkingHour"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "WorkingHour_dealershipId_dayOfWeek_key" ON "WorkingHour"("dealershipId", "dayOfWeek");
