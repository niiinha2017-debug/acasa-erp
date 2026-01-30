import { Test, TestingModule } from '@nestjs/testing';
import { FornecedorService } from './fornecedores.service';

describe('FornecedoresService', () => {
  let service: FornecedorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FornecedorService],
    }).compile();

    service = module.get<FornecedorService>(FornecedorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
