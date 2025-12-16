import { Test, TestingModule } from '@nestjs/testing';
import { InsumosController } from './insumos.controller';

describe('InsumosController', () => {
  let controller: InsumosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InsumosController],
    }).compile();

    controller = module.get<InsumosController>(InsumosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
