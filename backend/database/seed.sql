-- Insere as permissões básicas
INSERT INTO permissions (codigo, label) VALUES 
('aprovar_usuarios', 'Permitir aprovar novos cadastros'),
('gerenciar_roles', 'Permitir configurar níveis de acesso');

-- Insere os cargos (Roles) se não existirem
INSERT INTO roles (codigo, label) VALUES 
('admin', 'Administrador Total'),
('colaborador', 'Colaborador Padrão');
