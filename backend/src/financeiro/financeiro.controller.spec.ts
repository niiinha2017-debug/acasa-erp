import { Test, TestingModule } from '@nestjs/testing';
import { FinanceiroController } from './financeiro.controller';

describe('FinanceiroController', () => {
  let controller: FinanceiroController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinanceiroController],
    }).compile();

    controller = module.get<FinanceiroController>(FinanceiroController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
