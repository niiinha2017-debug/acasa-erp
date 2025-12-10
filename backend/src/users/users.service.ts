// src/users/users.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity'; 

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // 💡 CORREÇÃO TS2322: Alterado de 'User | undefined' para 'User | null'
async findOne(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username: username } });
  }
}