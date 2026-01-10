import { Test, TestingModule } from '@nestjs/testing';
import { PermissoesService } from './permissoes.service';

describe('PermissoesService', () => {
  let service: PermissoesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissoesService],
    }).compile();

    service = module.get<PermissoesService>(PermissoesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
