import { Test, TestingModule } from '@nestjs/testing';
import { SolicitacoesController } from './solicitacoes.controller';
import { SolicitacoesService } from './solicitacoes.service';

describe('SolicitacoesController', () => {
  let controller: SolicitacoesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SolicitacoesController],
      providers: [SolicitacoesService],
    }).compile();

    controller = module.get<SolicitacoesController>(SolicitacoesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
