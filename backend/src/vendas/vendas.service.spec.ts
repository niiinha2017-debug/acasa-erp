import { Test, TestingModule } from '@nestjs/testing';
import { VendasService } from './vendas.service';
import { PrismaService } from '../prisma/prisma.service';
import { AgendaService } from '../agenda/agenda.service';
import { TwinFlowService } from '../agenda/twin-flow.service';

describe('VendasService', () => {
  let service: VendasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendasService,
        { provide: PrismaService, useValue: {} },
        { provide: AgendaService, useValue: {} },
        { provide: TwinFlowService, useValue: {} },
      ],
    }).compile();

    service = module.get<VendasService>(VendasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
