import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { EncaminharProducaoDto } from './dto/encaminhar-producao.dto'

function round2(n: number) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

@Injectable()
export class ProducaoEncaminhamentoService {
  constructor(private readonly prisma: PrismaService) {}

  async encaminhar(dto: EncaminharProducaoDto) {
    const origem_tipo = String(dto.origem_tipo || '').trim().toUpperCase()
    const origem_id = Number(dto.origem_id)

    const inicio = new Date(dto.inicio_em)
    const fim = new Date(dto.fim_em)

    if (!origem_tipo) throw new BadRequestException('origem_tipo é obrigatório.')
    if (!origem_id) throw new BadRequestException('origem_id inválido.')
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
      throw new BadRequestException('inicio_em/fim_em inválidos.')
    }
    if (fim.getTime() <= inicio.getTime()) throw new BadRequestException('fim_em deve ser maior que inicio_em.')

    const funcIds = (dto.funcionario_ids || []).map(Number).filter((n) => n > 0)
    if (!funcIds.length) throw new BadRequestException('Selecione ao menos 1 funcionário.')

    const titulo = String(dto.titulo || '').trim()
    if (!titulo) throw new BadRequestException('titulo é obrigatório.')

    const horas = (fim.getTime() - inicio.getTime()) / 36e5

    return this.prisma.$transaction(async (tx) => {
      // 1) garante producao_projetos (idempotente)
      const existente = await tx.producao_projetos.findFirst({
        where: { origem_tipo, origem_id },
        select: { id: true },
      })

      const projeto = existente
        ? await tx.producao_projetos.update({
            where: { id: existente.id },
            data: { status: 'ABERTO', encaminhado_em: new Date() },
            select: { id: true },
          })
        : await tx.producao_projetos.create({
            data: { origem_tipo, origem_id, status: 'ABERTO', encaminhado_em: new Date() },
            select: { id: true },
          })

      // 2) pega custo_hora dos funcionários (snapshot)
      const funcionarios = await tx.funcionarios.findMany({
        where: { id: { in: funcIds } },
        select: { id: true, custo_hora: true },
      })
      if (!funcionarios.length) throw new BadRequestException('Funcionários inválidos.')

      // 3) cria 1 tarefa por funcionário (horário EXATO do clique)
      await tx.producao_tarefas.createMany({
        data: funcionarios.map((f) => {
          const custoHora = Number(f.custo_hora || 0)
          const custoTotal = round2(custoHora * horas)

          return {
            projeto_id: projeto.id,
            funcionario_id: f.id,
            titulo,
            status: 'PENDENTE',
            observacao: dto.observacao ? String(dto.observacao) : null,
            inicio_em: inicio, // ✅ EXATO do clique
            fim_em: fim,       // ✅ EXATO do clique
            custo_hora_aplicado: custoHora,
            custo_total: custoTotal,
          }
        }),
      })

      // 4) muda pipeline da origem (sem “inventar”: só os que você já definiu)
      if (origem_tipo === 'PLANO_CORTE') {
        // ⚠️ Ajuste o model/campo de status conforme seu Prisma real do plano de corte
        await tx.plano_corte.update({
          where: { id: origem_id },
          data: { status: 'EM_PRODUCAO' },
        })
      }

      if (origem_tipo === 'VENDA') {
        // Venda → pipeline do cliente é na OBRA: seta data_producao = inicio_em
        const venda = await tx.vendas.findUnique({
          where: { id: origem_id },
          select: { id: true, cliente_id: true },
        })
        if (!venda) throw new NotFoundException('Venda não encontrada.')

        const obra = await tx.obras.findFirst({
          where: { cliente_id: venda.cliente_id },
          orderBy: { atualizado_em: 'desc' },
          select: { id: true },
        })
        if (!obra) throw new BadRequestException('Cliente não possui OBRA. Crie a obra antes de enviar para produção.')

        await tx.obras.update({
          where: { id: obra.id },
          data: { data_producao: inicio }, // ✅ seu ObrasService recalcula status_processo automaticamente
        })
      }

      // Se no futuro entrar ORCAMENTO/OBRA direto, você adiciona aqui explicitamente.
      return { ok: true, projeto_id: projeto.id }
    })
  }
}
