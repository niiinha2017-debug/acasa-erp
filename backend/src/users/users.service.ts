// backend/src/users/users.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// CORREÇÃO CRÍTICA: Use o caminho ./entities/user.ts (conforme Imagem 2b9f73)
import { User } from './user'; 

@Injectable()
export class UsersService { // <--- PRECISA DESTA CLASSE (TS1005)
  constructor(
    @InjectRepository(User) 
    private userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }
}