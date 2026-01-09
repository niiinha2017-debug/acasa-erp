import { Test, TestingModule } from '@nestjs/testing';
import { OrcamentosService } from './orcamentos.service';

describe('OrcamentosService', () => {
  let service: OrcamentosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrcamentosService],
    }).compile();

    service = module.get<OrcamentosService>(OrcamentosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
