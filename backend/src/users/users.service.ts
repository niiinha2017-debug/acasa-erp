import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>, // Ferramenta padrão do TypeORM
  ) {}

  // Buscar TODOS
  findAll() {
    return this.usersRepository.find();
  }

  // Buscar UM pelo ID
  findOne(id: number) {
    return this.usersRepository.findOneBy({ id });
  }

  // (Os outros deixamos vazios por enquanto para não dar erro)
  create(createDto: any) { return 'Criar (em breve)'; }
  update(id: number, updateDto: any) { return 'Atualizar (em breve)'; }
  remove(id: number) { return 'Deletar (em breve)'; }
}