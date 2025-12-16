import { Test, TestingModule } from '@nestjs/testing';
import { PlanoCorteService } from './plano-corte.service';

describe('PlanoCorteService', () => {
  let service: PlanoCorteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlanoCorteService],
    }).compile();

    service = module.get<PlanoCorteService>(PlanoCorteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
