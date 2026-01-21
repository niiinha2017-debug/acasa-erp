import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { SalvarPontoJustificativaDto } from '../justificativa/salvar-ponto-justificativa.dto'

function asDia00(data: string) {
  // força 00:00:00
  const d = new Date(data)
  if (Number.isNaN(d.getTime())) throw new BadRequestException('Data inválida')
  d.setHours(0, 0, 0, 0)
  return d
}

@Injectable()
export class PontoJustificativasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(params: { funcionario_id?: string; mes?: string; ano?: string }) {
    const funcionario_id = params.funcionario_id ? Number(String(params.funcionario_id).replace(/\D/g, '')) : undefined
    const mes = params.mes ? Number(String(params.mes).replace(/\D/g, '')) : undefined
    const ano = params.ano ? Number(String(params.ano).replace(/\D/g, '')) : undefined

    let dataIni: Date | undefined
    let dataFim: Date | undefined

    if (mes && ano) {
      dataIni = new Date(ano, mes - 1, 1, 0, 0, 0, 0)
      dataFim = new Date(ano, mes, 1, 0, 0, 0, 0) // exclusivo
    }

    return this.prisma.ponto_justificativas.findMany({
      where: {
        funcionario_id,
        ...(dataIni && dataFim ? { data: { gte: dataIni, lt: dataFim } } : {}),
      },
      include: { arquivos: true },
      orderBy: [{ data: 'asc' }],
    })
  }

async salvar(dto: SalvarPontoJustificativaDto) {
  const data = asDia00(dto.data)

  const existente = await this.prisma.ponto_justificativas.findFirst({
    where: { funcionario_id: dto.funcionario_id, data },
    select: { id: true },
  })

  if (!existente) {
    return this.prisma.ponto_justificativas.create({
      data: {
        funcionario_id: dto.funcionario_id,
        data,
        tipo: dto.tipo,
        descricao: dto.descricao || null,
      },
    })
  }

  return this.prisma.ponto_justificativas.update({
    where: { id: existente.id },
    data: {
      tipo: dto.tipo,
      descricao: dto.descricao || null,
    },
  })
}


  async remover(id: number) {
    // arquivos deletam por cascade
    return this.prisma.ponto_justificativas.delete({ where: { id } })
  }
  async anexarArquivo(justificativa_id: number, file: Express.Multer.File) {
    if (!justificativa_id) throw new BadRequestException('ID inválido')
    if (!file) throw new BadRequestException('Arquivo é obrigatório')

    const existe = await this.prisma.ponto_justificativas.findUnique({
      where: { id: justificativa_id },
      select: { id: true },
    })
    if (!existe) throw new NotFoundException('Justificativa não encontrada')

    return this.prisma.ponto_justificativas_arquivos.create({
      data: {
        justificativa_id,
        arquivo_nome: file.originalname,
        mime_type: file.mimetype,
        tamanho: file.size,
        arquivo_path: file.path.replace(/\\/g, '/'),
      },
    })
  }

  async removerArquivo(id: number) {
    if (!id) throw new BadRequestException('ID inválido')
    // aqui remove só do banco; depois, se você quiser, a gente apaga o arquivo físico também
    return this.prisma.ponto_justificativas_arquivos.delete({ where: { id } })
  }
}
