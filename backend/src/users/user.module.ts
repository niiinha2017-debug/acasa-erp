// backend/src/users/users.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
// Caminho CORRIGIDO: Deve navegar para dentro de 'entities/user/'
import { User } from './entities/user.entity'; 

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  exports: [UsersService], 
})
export class UsersModule {}