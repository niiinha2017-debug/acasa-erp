import { Test, TestingModule } from '@nestjs/testing';
import { FornecedoresService } from './fornecedores.service';

describe('FornecedoresService', () => {
  let service: FornecedoresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FornecedoresService],
    }).compile();

    service = module.get<FornecedoresService>(FornecedoresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
