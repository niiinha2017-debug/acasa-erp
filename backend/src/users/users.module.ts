import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity'; // Exatamente assim.

import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // ADICIONE ESTA LINHA
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // EXPORTE O SERVIÇO para que o AuthService possa usá-lo
})
export class UsersModule {}