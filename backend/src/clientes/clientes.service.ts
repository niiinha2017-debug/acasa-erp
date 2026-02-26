import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CriarClienteDto } from './dto/criar-cliente.dto';
import { AtualizarClienteDto } from './dto/atualizar-cliente.dto';
import { Prisma } from '@prisma/client';
import { PIPELINE_CLIENTE } from '../shared/constantes/pipeline-cliente';
import {
  normalizarStatusCliente,
  validarTransicaoStatusCliente,
} from '../shared/constantes/pipeline-cliente';

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly statusClienteEncerrado =
    PIPELINE_CLIENTE.find(
      (s) => String(s.key || '').toUpperCase() === 'ENCERRADO',
    )?.key || 'ENCERRADO';

  /**
   * Regra automática:
   * Se cliente estiver em MEDIDA_AGENDADA e a data do agendamento de medida já passou,
   * promove para MEDIDA_REALIZADA.
   */
  private async aplicarStatusAutomaticoMedidaRealizada() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const candidatos = await this.prisma.cliente.findMany({
      where: {
        status: 'MEDIDA_AGENDADA',
        OR: [
          {
            agendamentos_loja: {
              some: {
                categoria: 'MEDIDA',
                inicio_em: { lt: hoje },
                status: { not: 'CANCELADO' },
              },
            },
          },
          {
            agendamentos_fabrica: {
              some: {
                categoria: 'MEDIDA',
                inicio_em: { lt: hoje },
                status: { not: 'CANCELADO' },
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    const ids = candidatos.map((c) => c.id);
    if (!ids.length) return;

    await this.prisma.cliente.updateMany({
      where: { id: { in: ids } },
      data: { status: 'MEDIDA_REALIZADA' },
    });
  }

  async criar(dto: CriarClienteDto) {
    const statusInicialPipeline =
      PIPELINE_CLIENTE && PIPELINE_CLIENTE.length
        ? PIPELINE_CLIENTE[0].key
        : 'ATIVO';
    const statusDestino = dto.status
      ? normalizarStatusCliente(dto.status)
      : normalizarStatusCliente(statusInicialPipeline);

    const validacaoStatus = validarTransicaoStatusCliente({
      atual: null,
      proximo: statusDestino,
    });
    if (!validacaoStatus.ok) {
      throw new BadRequestException(
        `Criação de cliente: ${validacaoStatus.motivo}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.create({
        data: {
          indicacao_id: dto.indicacao_id ?? null,
          indicacao_origem: dto.indicacao_origem ?? null,

          nome_completo: dto.nome_completo,
          razao_social: dto.razao_social ?? null,
          nome_fantasia: dto.nome_fantasia ?? null,

          data_nascimento: dto.data_nascimento
            ? new Date(dto.data_nascimento)
            : null,

          cpf: dto.cpf ?? null,
          rg: dto.rg ?? null,
          cnpj: dto.cnpj ?? null,
          ie: dto.ie ?? null,

          telefone: dto.telefone ?? null,
          whatsapp: dto.whatsapp ?? null,
          email: dto.email ?? null,

          estado_civil: dto.estado_civil ?? null,
          nome_conjuge:
            dto.estado_civil === 'CASADO' ? (dto.nome_conjuge ?? null) : null,

          cep: dto.cep ?? null,
          endereco: dto.endereco ?? null,
          numero: dto.numero ?? null,
          complemento: dto.complemento ?? null,
          bairro: dto.bairro ?? null,
          cidade: dto.cidade ?? null,
          estado: dto.estado ?? null,

          status: statusDestino,

          enviar_aniversario_email: dto.enviar_aniversario_email ?? true,
          enviar_aniversario_whatsapp: dto.enviar_aniversario_whatsapp ?? false,
        },
      });
      return cliente;
    });
  }

  async listar() {
    await this.aplicarStatusAutomaticoMedidaRealizada();
    const rows = await this.prisma.cliente.findMany({
      where: {
        status: {
          notIn: ['INATIVO', this.statusClienteEncerrado],
        },
      },
      orderBy: { nome_completo: 'asc' },
    });

    return rows;
  }

  async buscarPorId(id: number) {
    await this.aplicarStatusAutomaticoMedidaRealizada();
    const cliente = await this.prisma.cliente.findUnique({ where: { id } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }

  async atualizar(id: number, dto: AtualizarClienteDto) {
    const atual = await this.buscarPorId(id);

    let statusAtualizado: string | undefined = undefined;
    if (dto.status !== undefined) {
      const destino = normalizarStatusCliente(dto.status);
      const validacaoStatus = validarTransicaoStatusCliente({
        atual: atual.status,
        proximo: destino,
      });
      if (!validacaoStatus.ok) {
        throw new BadRequestException(
          `Atualização de cliente: ${validacaoStatus.motivo}`,
        );
      }
      statusAtualizado = destino;
    }

    const cpfNorm =
      dto.cpf !== undefined && dto.cpf !== null && String(dto.cpf).trim() !== ''
        ? String(dto.cpf).trim()
        : null;
    const cnpjNorm =
      dto.cnpj !== undefined &&
      dto.cnpj !== null &&
      String(dto.cnpj).trim() !== ''
        ? String(dto.cnpj).trim()
        : null;
    const emailNorm =
      dto.email !== undefined &&
      dto.email !== null &&
      String(dto.email).trim() !== ''
        ? String(dto.email).trim()
        : null;

    if (cpfNorm !== null) {
      const outro = await this.prisma.cliente.findFirst({
        where: { cpf: cpfNorm, id: { not: id } },
        select: { id: true },
      });
      if (outro) {
        throw new BadRequestException('Outro cliente já possui este CPF.');
      }
    }
    if (cnpjNorm !== null) {
      const outro = await this.prisma.cliente.findFirst({
        where: { cnpj: cnpjNorm, id: { not: id } },
        select: { id: true },
      });
      if (outro) {
        throw new BadRequestException('Outro cliente já possui este CNPJ.');
      }
    }
    if (emailNorm !== null) {
      const outro = await this.prisma.cliente.findFirst({
        where: { email: emailNorm, id: { not: id } },
        select: { id: true },
      });
      if (outro) {
        throw new BadRequestException('Outro cliente já possui este e-mail.');
      }
    }

    return this.prisma.cliente.update({
      where: { id },
      data: {
        indicacao_id: dto.indicacao_id ?? undefined,
        indicacao_origem: dto.indicacao_origem ?? undefined,

        nome_completo: dto.nome_completo ?? undefined,
        razao_social: dto.razao_social ?? undefined,
        nome_fantasia: dto.nome_fantasia ?? undefined,

        data_nascimento: dto.data_nascimento
          ? new Date(dto.data_nascimento)
          : undefined,

        cpf: dto.cpf !== undefined ? (cpfNorm ?? null) : undefined,
        rg: dto.rg ?? undefined,
        cnpj: dto.cnpj !== undefined ? (cnpjNorm ?? null) : undefined,
        ie: dto.ie ?? undefined,

        telefone: dto.telefone ?? undefined,
        whatsapp: dto.whatsapp ?? undefined,
        email: dto.email !== undefined ? (emailNorm ?? null) : undefined,

        estado_civil: dto.estado_civil ?? undefined,
        nome_conjuge:
          dto.estado_civil === undefined
            ? (dto.nome_conjuge ?? undefined)
            : dto.estado_civil === 'CASADO'
              ? (dto.nome_conjuge ?? null)
              : null,

        cep: dto.cep ?? undefined,
        endereco: dto.endereco ?? undefined,
        numero: dto.numero ?? undefined,
        complemento: dto.complemento ?? undefined,
        bairro: dto.bairro ?? undefined,
        cidade: dto.cidade ?? undefined,
        estado: dto.estado ?? undefined,

        status: statusAtualizado,

        enviar_aniversario_email: dto.enviar_aniversario_email ?? undefined,
        enviar_aniversario_whatsapp:
          dto.enviar_aniversario_whatsapp ?? undefined,
      },
    });
  }

  async remover(id: number) {
    await this.buscarPorId(id);
    try {
      await this.prisma.cliente.delete({ where: { id } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        await this.prisma.$transaction(async (tx) => {
          await tx.agenda_loja.updateMany({
            where: { cliente_id: id, status: { not: 'CANCELADO' } },
            data: { status: 'CANCELADO' },
          });
          await tx.agenda_fabrica.updateMany({
            where: { cliente_id: id, status: { not: 'CANCELADO' } },
            data: { status: 'CANCELADO' },
          });

          await tx.contratos.updateMany({
            where: {
              cliente_id: id,
              status: { in: ['RASCUNHO', 'VIGENTE'] },
            },
            data: { status: 'ENCERRADO' },
          });

          await tx.cliente.update({
            where: { id },
            data: { status: this.statusClienteEncerrado },
          });
        });

        return { ok: true };
      }
      throw e;
    }
    return { ok: true };
  }

  async select(q?: string) {
    await this.aplicarStatusAutomaticoMedidaRealizada();
    const termo = String(q || '').trim();

    const rows = await this.prisma.cliente.findMany({
      where: {
        AND: [
          {
            status: { notIn: ['INATIVO', this.statusClienteEncerrado] },
          },
          ...(termo
            ? [
                {
                  OR: [
                    { nome_completo: { contains: termo } },
                    { razao_social: { contains: termo } },
                    { cpf: { contains: termo } },
                    { cnpj: { contains: termo } },
                  ],
                },
              ]
            : []),
        ],
      },
      select: {
        id: true,
        nome_completo: true,
        razao_social: true,
      },
      orderBy: { nome_completo: 'asc' },
      take: 50,
    });

    return rows.map((c) => ({
      value: c.id,
      label: c.nome_completo || c.razao_social || `ID #${c.id}`,
    }));
  }

  async aniversariantesDoDia(data: string, enviar?: 'email' | 'whatsapp') {
    const dt = new Date(data);
    if (Number.isNaN(dt.getTime())) throw new Error('Data inválida');

    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    const mmdd = `${mm}-${dd}`;

    const filtro =
      enviar === 'email'
        ? Prisma.sql`AND enviar_aniversario_email = 1 AND email IS NOT NULL AND email <> ''`
        : enviar === 'whatsapp'
          ? Prisma.sql`AND enviar_aniversario_whatsapp = 1 AND whatsapp IS NOT NULL AND whatsapp <> ''`
          : Prisma.sql``;

    return this.prisma.$queryRaw(
      Prisma.sql`
    SELECT *
    FROM clientes
    WHERE data_nascimento IS NOT NULL
      AND DATE_FORMAT(data_nascimento, '%m-%d') = ${mmdd}
    ${filtro}
    ORDER BY nome_completo ASC
  `,
    );
  }
}
