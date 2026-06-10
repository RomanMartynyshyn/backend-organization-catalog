/*
  Warnings:

  - You are about to drop the column `zip_code` on the `locations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `locations` DROP COLUMN `zip_code`,
    ADD COLUMN `post_code` VARCHAR(191) NULL,
    MODIFY `street` VARCHAR(191) NULL;
