// backend/src/users/users.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// Corrigido para o caminho que parece ser o principal:
import { User } from './entities/user.entity'; 
// SE o erro persistir, TENTE: import { User } from './entities/user/user.entity'; 

@Injectable()
export class UsersService { 
  constructor(
    @InjectRepository(User) 
    private userRepository: Repository<User>,
  ) {}

  // O método agora está DENTRO da classe, resolvendo o TS1005
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }
}