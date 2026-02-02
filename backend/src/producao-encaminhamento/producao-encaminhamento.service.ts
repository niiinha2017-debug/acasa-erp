import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { EncaminharProducaoDto } from './dto/encaminhar-producao.dto'
import { randomUUID } from 'crypto'


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
    const projeto = await tx.producao_projetos.upsert({
      where: { origem_tipo_origem_id: { origem_tipo, origem_id } },
      create: {
        codigo: `PROD-${randomUUID()}`,
        origem_tipo,
        origem_id,
        status,
        encaminhado_em: agora,
      },
      update: {
        status,
        encaminhado_em: agora,
      },
      select: { id: true },
    })

    if (origem_tipo === 'PLANO_CORTE') {
      await tx.plano_corte.update({
        where: { id: origem_id },
        data: { status: 'EM_PRODUCAO' },
      })
    }

    return { ok: true, projeto_id: projeto.id }
  })
}


}
