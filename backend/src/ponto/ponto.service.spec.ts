import { Test, TestingModule } from '@nestjs/testing';
import { PontoService } from './ponto.service';

describe('PontoService', () => {
  let service: PontoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PontoService],
    }).compile();

    service = module.get<PontoService>(PontoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
