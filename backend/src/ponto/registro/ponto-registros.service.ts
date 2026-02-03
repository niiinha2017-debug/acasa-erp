import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AtualizarPontoRegistroDto } from '../dto/atualizar-ponto-registro.dto'
import { PontoTipoRegistro } from '@prisma/client' // Importante para o Enum

@Injectable()
export class PontoRegistrosService {
  constructor(private readonly prisma: PrismaService) {}

  async atualizar(id: number, dto: AtualizarPontoRegistroDto) {
    if (!id) throw new BadRequestException('ID inválido')

    const existe = await this.prisma.ponto_registros.findUnique({
      where: { id },
      select: { id: true },
    })
    
    if (!existe) throw new NotFoundException('Registro não encontrado')

    // Converte a data se ela vier no DTO
    const dataHora = dto.data_hora ? new Date(dto.data_hora) : undefined

    return this.prisma.ponto_registros.update({
      where: { id },
      data: {
        ...(dataHora && { data_hora: dataHora }),
        ...(dto.tipo && { tipo: dto.tipo as PontoTipoRegistro }), // Cast para o Enum do Prisma
        ...(dto.observacao !== undefined && { observacao: dto.observacao }),
      },
      select: {
        id: true,
        tipo: true,
        origem: true,
        data_hora: true,
        status: true,
        observacao: true,
        funcionario_id: true,
        dispositivo_id: true,
        // Opcional: retornar campos de GPS como null apenas para confirmar na API
        latitude: true,
        longitude: true
      },
    })
  }
}