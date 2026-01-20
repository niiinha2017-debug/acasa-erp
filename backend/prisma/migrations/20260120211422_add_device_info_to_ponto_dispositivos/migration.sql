-- AlterTable
ALTER TABLE `ponto_dispositivos` ADD COLUMN `language` VARCHAR(20) NULL,
    ADD COLUMN `pixel_ratio` DOUBLE NULL,
    ADD COLUMN `screen` VARCHAR(20) NULL,
    ADD COLUMN `standalone` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `timezone` VARCHAR(80) NULL,
    ADD COLUMN `user_agent` VARCHAR(255) NULL;
