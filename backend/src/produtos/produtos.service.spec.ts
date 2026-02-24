import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProdutosService } from './produtos.service';

describe('ProdutosService', () => {
  let service: ProdutosService;
  let prismaMock: {
    produtos: {
      findFirst: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      produtos: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProdutosService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<ProdutosService>(ProdutosService);
  });

  it('deve criar produto com sucesso', async () => {
    prismaMock.produtos.findFirst.mockResolvedValue(null);
    prismaMock.produtos.create.mockResolvedValue({ id: 101 });

    const dto = {
      fornecedor_id: 7,
      nome_produto: '  MDF BRANCO  ',
      marca: ' Duratex ',
      cor: ' Branco ',
      medida: '18mm',
      unidade: 'M2',
      quantidade: 2,
      valor_unitario: 10.5,
      valor_total: 21,
    } as any;

    const result = await service.criar(dto);

    expect(result).toEqual({ id: 101 });
    expect(prismaMock.produtos.findFirst).toHaveBeenCalledTimes(1);
    expect(prismaMock.produtos.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fornecedor_id: 7,
        nome_produto: 'MDF BRANCO',
        marca: 'Duratex',
        cor: 'Branco',
        medida: '18mm',
        unidade: 'M2',
        status: 'ATIVO',
      }),
    });
  });

  it('deve bloquear cadastro de produto duplicado', async () => {
    prismaMock.produtos.findFirst.mockResolvedValue({ id: 55 });

    await expect(
      service.criar({
        fornecedor_id: 3,
        nome_produto: 'CHAPA MDF',
        marca: 'Marca X',
        cor: 'Preto',
        medida: '15mm',
      } as any),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.produtos.create).not.toHaveBeenCalled();
  });

  it('deve exigir fornecedor_id no cadastro', async () => {
    await expect(
      service.criar({
        fornecedor_id: undefined,
        nome_produto: 'Produto teste',
      } as any),
    ).rejects.toThrow('fornecedor_id é obrigatório.');
  });
});
