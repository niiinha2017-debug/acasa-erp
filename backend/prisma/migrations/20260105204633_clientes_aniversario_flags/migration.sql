-- AlterTable
ALTER TABLE `clientes` ADD COLUMN `enviar_aniversario_email` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `enviar_aniversario_whatsapp` BOOLEAN NOT NULL DEFAULT false;
