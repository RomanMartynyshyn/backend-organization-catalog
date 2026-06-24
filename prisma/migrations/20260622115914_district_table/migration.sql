/*
  Warnings:

  - You are about to drop the column `district` on the `locations` table. All the data in the column will be lost.
  - You are about to alter the column `street` on the `locations` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - You are about to alter the column `city` on the `locations` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - You are about to alter the column `region` on the `locations` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - You are about to alter the column `working_hours` on the `organizations` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.

*/
-- DropForeignKey
ALTER TABLE `locations` DROP FOREIGN KEY `locations_organization_id_fkey`;

-- DropForeignKey
ALTER TABLE `organization_categories` DROP FOREIGN KEY `organization_categories_category_id_fkey`;

-- DropForeignKey
ALTER TABLE `organization_categories` DROP FOREIGN KEY `organization_categories_organization_id_fkey`;

-- DropIndex
DROP INDEX `organization_categories_category_id_fkey` ON `organization_categories`;

-- AlterTable
ALTER TABLE `locations` DROP COLUMN `district`,
    ADD COLUMN `district_id` INTEGER NULL,
    MODIFY `street` VARCHAR(50) NULL,
    MODIFY `city` VARCHAR(50) NOT NULL,
    MODIFY `region` VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE `organizations` MODIFY `name` VARCHAR(255) NOT NULL,
    MODIFY `website_url` VARCHAR(255) NULL,
    MODIFY `working_hours` VARCHAR(100) NULL;

-- CreateTable
CREATE TABLE `districts` (
    `district_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `districts_name_key`(`name`),
    PRIMARY KEY (`district_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `locations_district_id_idx` ON `locations`(`district_id`);

-- AddForeignKey
ALTER TABLE `organization_categories` ADD CONSTRAINT `organization_categories_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organization_categories` ADD CONSTRAINT `organization_categories_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `locations` ADD CONSTRAINT `locations_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `locations` ADD CONSTRAINT `locations_district_id_fkey` FOREIGN KEY (`district_id`) REFERENCES `districts`(`district_id`) ON DELETE SET NULL ON UPDATE CASCADE;
