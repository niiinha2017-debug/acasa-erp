// backend/src/users/user.module.ts (ou users.module.ts)

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
// Caminho ajustado:
import { User } from './entities/user.entity'; 

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  exports: [UsersService], // Necessário para o AuthModule
})
export class UsersModule {}