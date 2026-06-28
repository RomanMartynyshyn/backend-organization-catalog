/*
  Warnings:

  - You are about to drop the column `district_id` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the `districts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `locations` DROP FOREIGN KEY `locations_district_id_fkey`;

-- DropIndex
DROP INDEX `locations_district_id_idx` ON `locations`;

-- AlterTable
ALTER TABLE `locations` DROP COLUMN `district_id`,
    ADD COLUMN `admin_unit_id` INTEGER NULL;

-- DropTable
DROP TABLE `districts`;

-- CreateTable
CREATE TABLE `admin_units` (
    `admin_unit_id` INTEGER NOT NULL AUTO_INCREMENT,
    `parent_id` INTEGER NOT NULL,
    `type` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`admin_unit_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `locations_admin_unit_id_idx` ON `locations`(`admin_unit_id`);

-- AddForeignKey
ALTER TABLE `locations` ADD CONSTRAINT `locations_admin_unit_id_fkey` FOREIGN KEY (`admin_unit_id`) REFERENCES `admin_units`(`admin_unit_id`) ON DELETE SET NULL ON UPDATE CASCADE;
