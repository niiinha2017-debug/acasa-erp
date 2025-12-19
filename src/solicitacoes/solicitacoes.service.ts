import { Injectable } from '@nestjs/common';
import { CreateSolicitacoeDto } from './dto/create-solicitacoe.dto';
import { UpdateSolicitacoeDto } from './dto/update-solicitacoe.dto';

@Injectable()
export class SolicitacoesService {
  create(createSolicitacoeDto: CreateSolicitacoeDto) {
    return 'This action adds a new solicitacoe';
  }

  findAll() {
    return `This action returns all solicitacoes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} solicitacoe`;
  }

  update(id: number, updateSolicitacoeDto: UpdateSolicitacoeDto) {
    return `This action updates a #${id} solicitacoe`;
  }

  remove(id: number) {
    return `This action removes a #${id} solicitacoe`;
  }
}
