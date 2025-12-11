// backend/src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { UsersModule } from '../users/user.module'; // Importa o UsersModule
// ... outros imports

@Module({
  imports: [
    UsersModule, // <--- Adiciona o UsersModule
    // ...
  ],
  // ...
})
export class AuthModule {}