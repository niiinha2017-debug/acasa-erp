import storage from '@/utils/storage'
// Importamos o AppConfig apenas para o sistema saber que ele existe, 
// mas não vamos deixar a navegação travar por causa dele.
import { AppConfig } from '@/services/config' 

export function isAdmin() {
  const u = storage.getUser();
  const perms = Array.isArray(u?.permissoes) ? u.permissoes : [];
  
  // LIBERAÇÃO TOTAL: 
  // Se for o seu usuário ou se a permissão 'admin' estiver no array.
  return u?.usuario === 'Ana.P' || perms.includes('admin');
}

export function can(chave) {
  // 1. Se for Admin, retorna true IMEDIATAMENTE.
  // Isso ignora qualquer verificação de módulo ou chave que ainda não existe.
  if (isAdmin()) return true;

  const u = storage.getUser();
  const perms = Array.isArray(u?.permissoes) ? u.permissoes : [];

  // 2. Para usuários comuns, verifica se a chave existe no array de permissões dele.
  return perms.includes(chave);
}