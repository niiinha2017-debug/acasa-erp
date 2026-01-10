import { Test, TestingModule } from '@nestjs/testing';
import { PermissoesController } from './permissoes.controller';

describe('PermissoesController', () => {
  let controller: PermissoesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissoesController],
    }).compile();

    controller = module.get<PermissoesController>(PermissoesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
