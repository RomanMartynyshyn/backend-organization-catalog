-- AlterTable
ALTER TABLE `organizations` ADD COLUMN `contacts` JSON NULL,
    ADD COLUMN `social_links` JSON NULL,
    ADD COLUMN `working_hours` VARCHAR(191) NULL;
