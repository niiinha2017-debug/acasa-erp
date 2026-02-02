import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { EncaminharProducaoDto } from './dto/encaminhar-producao.dto'

@Injectable()
export class ProducaoEncaminhamentoService {
  constructor(private readonly prisma: PrismaService) {}

  async encaminhar(dto: EncaminharProducaoDto) {
  const origem_tipo = String(dto.origem_tipo || '').trim().toUpperCase()
  const origem_id = Number(dto.origem_id)

  if (!origem_tipo) throw new BadRequestException('origem_tipo é obrigatório.')
  if (!origem_id || origem_id <= 0) throw new BadRequestException('origem_id inválido.')

  const status = dto.status ? String(dto.status).trim() : 'ABERTO'
  const agora = new Date()

  return this.prisma.$transaction(async (tx) => {
    // 1) cria/atualiza producao_projetos (hora exata do clique)
    const existente = await tx.producao_projetos.findFirst({
      where: { origem_tipo, origem_id },
      select: { id: true },
    })

    const projeto = existente
      ? await tx.producao_projetos.update({
          where: { id: existente.id },
          data: { status, encaminhado_em: agora },
          select: { id: true },
        })
      : await tx.producao_projetos.create({
          data: { origem_tipo, origem_id, status, encaminhado_em: agora },
          select: { id: true },
        })

    // 2) pipeline da origem (somente o que você definiu)
    if (origem_tipo === 'PLANO_CORTE') {
      await tx.plano_corte.update({
        where: { id: origem_id },
        data: { status: 'EM_PRODUCAO' },
      })
    }

    // VENDA: aqui NÃO cria tarefa e NÃO seta data_producao.
    // Venda/Obra seguem pipeline por datas/agendamento, como você alinhou.

    return { ok: true, projeto_id: projeto.id }
  })
}

}
