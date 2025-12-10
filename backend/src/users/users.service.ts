import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity'; // Exatamente assim.

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) // Injete o Repositório do TypeORM
    private usersRepository: Repository<User>,
  ) {}

  // Novo método: Encontrar usuário pelo username
  async findOne(username: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { username: username } });
  }

  // Se você tiver um método de criação (create), garanta que ele usa o bcrypt antes de salvar!
  // async create(userData: Partial<User>): Promise<User> {
  //   // ... código com bcrypt.hash() ...
  // }
}
