// backend/src/users/user.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
// CORREÇÃO CRÍTICA: Use o caminho ./entities/user.ts
import { User } from './user'; 

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  exports: [UsersService], 
})
export class UsersModule {}