import { Test, TestingModule } from '@nestjs/testing';
import { SolicitacoesService } from './solicitacoes.service';

describe('SolicitacoesService', () => {
  let service: SolicitacoesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SolicitacoesService],
    }).compile();

    service = module.get<SolicitacoesService>(SolicitacoesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
