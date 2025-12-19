import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository,MoreThan } from 'typeorm';
import { User } from './user.entity';
import * as  bcryptjs from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // CORREÇÃO: Busca por e-mail ou usuário usando 'any' para evitar erro de tipagem rígida
  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: [
        { email: identifier } as any, 
        { usuario: identifier } as any 
      ],
    });
  }
// 1. Gera o token e "anota" no banco
async gerarTokenRecuperacao(email: string) {
  const user = await this.findByEmailOrUsername(email);
  if (!user) throw new BadRequestException('E-mail não encontrado.');

  const token = Math.random().toString(36).substring(2, 15); // Gera um código aleatório
  user.resetPasswordToken = token;
  user.resetPasswordExpires = new Date(Date.now() + 3600000); // Expira em 1 hora

  await this.usersRepository.save(user);
  return token; // Aqui você enviaria por e-mail no futuro
}

// 2. Valida o token e muda a senha de fato
async redefinirSenha(token: string, novaSenha: string) {
  const user = await this.usersRepository.findOne({
    where: { 
      resetPasswordToken: token,
      resetPasswordExpires: MoreThan(new Date()) // Verifica se ainda é válido
    } as any
  });

  if (!user) throw new BadRequestException('Token inválido ou expirado.');

  const salt = await bcryptjs.genSalt(10);
// Dentro de redefinirSenha no UsersService
user.password = await bcryptjs.hash(novaSenha, salt);
user.resetPasswordToken = null;   // Agora o TS aceita!
user.resetPasswordExpires = null; // Agora o TS aceita!

await this.usersRepository.save(user);
  return { message: 'Senha alterada com sucesso!' };
}
  async aprovarSolicitacao(id: number) {
    const solicitacao = await this.usersRepository.query(
      'SELECT * FROM solicitacoes_cadastro WHERE id = ?', [id]
    );

    if (!solicitacao.length) throw new BadRequestException('Solicitação não encontrada');
    const s = solicitacao[0];

    // CORREÇÃO: Usando 'as any' para garantir que 'name' e 'usuario' passem pelo TS
    const novoUsuario = this.usersRepository.create({
      name: s.nome,
      email: s.email,
      usuario: s.usuario,
      password: s.senha, 
      role: 'user' 
    } as any);

    await this.usersRepository.save(novoUsuario);

    await this.usersRepository.query(
      'UPDATE solicitacoes_cadastro SET status = "Aprovado" WHERE id = ?', [id]
    );

    return { message: 'Usuário aprovado com sucesso!' };
  }

  async buscarSolicitacoesPendentes() {
    return await this.usersRepository.query(
      'SELECT id, name, email, usuario, created_at FROM solicitacoes_cadastro WHERE status = "Pendente"'
    );
  }
}