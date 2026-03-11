import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca rota ou controller como público (sem exigir JWT).
 * Use em login, refresh, cadastro, esqueci-senha, webhooks, contratos por token, ponto/ativar.
 * Se um guard global JWT for ativado, rotas com @Public() continuarão acessíveis sem token.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
