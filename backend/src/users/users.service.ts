// backend/src/users/users.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// Caminho CORRIGIDO: Deve navegar para dentro de 'entities/user/'
import { User } from './entities/user.entity'; 

@Injectable()
export class UsersService { 
  constructor(
    @InjectRepository(User) 
    private userRepository: Repository<User>,
  ) {}

  // O método deve estar DENTRO da classe para resolver o erro TS1005
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }
}