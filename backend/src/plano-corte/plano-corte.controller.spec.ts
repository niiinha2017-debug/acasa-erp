import { Test, TestingModule } from '@nestjs/testing';
import { PlanoCorteController } from './plano-corte.controller';

describe('PlanoCorteController', () => {
  let controller: PlanoCorteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanoCorteController],
    }).compile();

    controller = module.get<PlanoCorteController>(PlanoCorteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
