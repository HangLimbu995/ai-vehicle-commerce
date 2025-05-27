/*
  Warnings:

  - The values [TUDESDAY] on the enum `dayOfWeek` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "dayOfWeek_new" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');
ALTER TABLE "WorkingHour" ALTER COLUMN "dayOfWeek" TYPE "dayOfWeek_new" USING ("dayOfWeek"::text::"dayOfWeek_new");
ALTER TYPE "dayOfWeek" RENAME TO "dayOfWeek_old";
ALTER TYPE "dayOfWeek_new" RENAME TO "dayOfWeek";
DROP TYPE "dayOfWeek_old";
COMMIT;
