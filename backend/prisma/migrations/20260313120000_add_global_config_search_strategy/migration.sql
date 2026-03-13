-- CreateTable
CREATE TABLE `global_config` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(80) NOT NULL,
  `search_strategy` ENUM('MIN_PRICE', 'AVG_PRICE', 'MAX_PRICE') NOT NULL DEFAULT 'AVG_PRICE',
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` DATETIME(3) NOT NULL,

  UNIQUE INDEX `global_config_key_key`(`key`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
