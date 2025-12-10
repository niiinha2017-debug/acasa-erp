import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user.entity'; // Importando a tabela que mapeamos

@Module({
  imports: [TypeOrmModule.forFeature([User])], // <--- A Mágica acontece aqui
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}