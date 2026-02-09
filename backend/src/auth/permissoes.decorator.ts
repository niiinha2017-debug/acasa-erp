import { SetMetadata } from '@nestjs/common';

// Marca a rota com as permissões exigidas
export const Permissoes = (...permissoes: string[]) =>
  SetMetadata('permissoes', permissoes);
