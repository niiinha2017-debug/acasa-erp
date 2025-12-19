import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitacaoCadastro } from './entities/solicitacoe.entity'; 
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SolicitacoesService {
  constructor(
    @InjectRepository(SolicitacaoCadastro)
    private repository: Repository<SolicitacaoCadastro>, // O nome oficial aqui é 'repository'
  ) {}
    
  async buscarTodas() {
    return await this.repository.find({
      order: { created_at: 'DESC' as any } 
    });
  }

  async buscarSolicitacoesPendentes() {
    // CORRIGIDO: Agora usa 'this.repository' em vez de 'usersRepository'
    return await this.repository.query(
      'SELECT * FROM solicitacoes_cadastro WHERE status = "Pendente"'
    );
  }

  async criarSolicitacao(dados: any) {
    const existe = await this.repository.findOne({ 
      where: [{ email: dados.email }, { usuario: dados.usuario }] 
    });

    if (existe) {
      throw new BadRequestException('Usuário ou e-mail já possui solicitação pendente.');
    }

    const salt = await bcrypt.genSalt(10);
    dados.senha = await bcrypt.hash(dados.senha, salt);

    const nova = this.repository.create(dados);
    return await this.repository.save(nova);
  }
}