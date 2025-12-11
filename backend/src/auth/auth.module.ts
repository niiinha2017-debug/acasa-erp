// backend/src/auth/auth.module.ts

import { Module } from '@nestjs/common';
// ... outros imports

// O UsersModule está um nível acima (../users/users.module)
import { UsersModule } from '../users/user.module'; 

@Module({
  imports: [
    UsersModule, // Adicionado
    // ...
  ],
  // ...
})
export class AuthModule {}