import { Test, TestingModule } from '@nestjs/testing';
import { FornecedoresController } from './fornecedores.controller';

describe('FornecedoresController', () => {
  let controller: FornecedoresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FornecedoresController],
    }).compile();

    controller = module.get<FornecedoresController>(FornecedoresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
