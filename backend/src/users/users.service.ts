import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs'; // Importe o bcrypt

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Função que você já tem
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  // NOVA FUNÇÃO: Cria usuário com senha protegida
  async create(userData: Partial<User>): Promise<User> {
    if (userData.password) {
      // Gera o "sal" e cria o hash da senha
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    const newUser = this.usersRepository.create(userData);
    return this.usersRepository.save(newUser);
  }
}