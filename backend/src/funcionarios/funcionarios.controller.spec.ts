import { Test, TestingModule } from '@nestjs/testing';
import { FuncionariosController } from './funcionarios.controller';

describe('FuncionariosController', () => {
  let controller: FuncionariosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FuncionariosController],
    }).compile();

    controller = module.get<FuncionariosController>(FuncionariosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
