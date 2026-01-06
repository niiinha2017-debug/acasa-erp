import { SetMetadata } from '@nestjs/common';

// Esta função apenas marca a rota com os setores permitidos
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);