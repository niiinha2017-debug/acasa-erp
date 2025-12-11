// backend/src/users/users.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// O caminho exato será corrigido no próximo passo (C)
import { User } from './entities/user.entity'; 

@Injectable()
export class UsersService { // <--- PRECISA ENVOLVER A LÓGICA
  constructor(
    @InjectRepository(User) 
    private userRepository: Repository<User>,
  ) {}

  // O método findByEmail agora está DENTRO da classe, resolvendo o TS1005.
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }
}