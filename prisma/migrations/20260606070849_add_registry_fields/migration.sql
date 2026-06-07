/*
  Warnings:

  - A unique constraint covering the columns `[edrpou]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `edrpou` to the `organizations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `organizations` ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `edrpou` VARCHAR(191) NOT NULL,
    ADD COLUMN `founders` TEXT NULL,
    ADD COLUMN `legal_status` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `organizations_edrpou_key` ON `organizations`(`edrpou`);
