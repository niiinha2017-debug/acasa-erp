-- ============================================================================
-- Migration: Adicionar relação usuario-funcionario (um-para-um)
-- Descrição: Vincula cada usuario a um funcionario (e vice-versa)
-- Data: 2026-02-08
-- ============================================================================

-- 1. Adicionar coluna 'usuario_id' em funcionarios
ALTER TABLE funcionarios ADD COLUMN usuario_id INT UNIQUE NULL 
  COMMENT 'FK para tabela usuarios (relação um-para-um)';

-- 2. Adicionar Foreign Key: funcionarios.usuario_id -> usuarios.id
ALTER TABLE funcionarios 
  ADD CONSTRAINT fk_funcionarios_usuario_id 
  FOREIGN KEY (usuario_id) 
  REFERENCES usuarios(id) 
  ON DELETE SET NULL;

-- 3. Adicionar coluna 'funcionario_id' em usuarios
ALTER TABLE usuarios ADD COLUMN funcionario_id INT UNIQUE NULL 
  COMMENT 'FK para tabela funcionarios (relação um-para-um)';

-- 4. Adicionar Foreign Key: usuarios.funcionario_id -> funcionarios.id
ALTER TABLE usuarios 
  ADD CONSTRAINT fk_usuarios_funcionario_id 
  FOREIGN KEY (funcionario_id) 
  REFERENCES funcionarios(id) 
  ON DELETE SET NULL;

-- ============================================================================
-- ÍNDICES (para melhor performance)
-- ============================================================================
CREATE INDEX idx_usuarios_funcionario_id ON usuarios(funcionario_id);
CREATE INDEX idx_funcionarios_usuario_id ON funcionarios(usuario_id);

-- ============================================================================
-- VERIFICAÇÃO: Dados não conflitados
-- ============================================================================
-- Se você tem dados antigos, precisar vincular usuarios com funcionarios manualmente.
-- Exemplo:
-- UPDATE usuarios u 
-- SET u.funcionario_id = (
--   SELECT f.id FROM funcionarios f 
--   WHERE f.email = u.email 
--   LIMIT 1
-- )
-- WHERE u.funcionario_id IS NULL;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
