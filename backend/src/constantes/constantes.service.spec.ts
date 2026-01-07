import { Test, TestingModule } from '@nestjs/testing';
import { ConstantesService } from './constantes.service';

describe('ConstantesService', () => {
  let service: ConstantesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConstantesService],
    }).compile();

    service = module.get<ConstantesService>(ConstantesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
