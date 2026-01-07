import { Test, TestingModule } from '@nestjs/testing';
import { ConstantesController } from './constantes.controller';

describe('ConstantesController', () => {
  let controller: ConstantesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConstantesController],
    }).compile();

    controller = module.get<ConstantesController>(ConstantesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
