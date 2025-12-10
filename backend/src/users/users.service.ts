import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll() {
    return this.usersRepository.find();
  }

  findOne(id: number) {
    return this.usersRepository.findOneBy({ id });
  }

  create(createDto: any) {
    return 'Criar (em breve)';
  }

  update(id: number, updateDto: any) {
    return 'Atualizar (em breve)';
  }

  remove(id: number) {
    return 'Deletar (em breve)';
  }

  async login(email: string, password: string) {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      return { error: true, message: "Usuário não encontrado" };
    }

    if (user.password !== password) {
      return { error: true, message: "Senha incorreta" };
    }

    return {
      success: true,
      message: "Login realizado com sucesso",
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
      }
    };
  }
}
