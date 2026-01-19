import { Test, TestingModule } from '@nestjs/testing';
import { ObrasController } from './obras.controller';

describe('ObrasController', () => {
  let controller: ObrasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ObrasController],
    }).compile();

    controller = module.get<ObrasController>(ObrasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
