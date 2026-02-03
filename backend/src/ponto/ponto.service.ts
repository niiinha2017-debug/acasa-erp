import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { CriarConviteDto } from './dto/criar-convite.dto'
import { AtivarDto } from './dto/ativar.dto'
import { RegistrarPontoDto } from './dto/registrar-ponto.dto'
import { createHash, randomBytes } from 'crypto'
// Importe os Enums do Prisma para evitar erro de tipo
import { PontoTipoRegistro, PontoOrigem } from '@prisma/client'

@Injectable()
export class PontoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private gerarCode(): string {
    return randomBytes(6).toString('hex').toUpperCase()
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  private getFuncionarioId(req: any): number {
    const ponto = req.ponto || {}
    const funcionario_id = Number(ponto.funcionario_id)
    if (!funcionario_id) throw new BadRequestException('Token inválido (funcionário).')
    return funcionario_id
  }

  private getDispositivoId(req: any): number | null {
    const ponto = req.ponto || {}
    const dispositivo_id = ponto.dispositivo_id ? Number(ponto.dispositivo_id) : null
    return dispositivo_id || null
  }

  private rangeHoje() {
    const inicio = new Date()
    inicio.setHours(0, 0, 0, 0)
    const fim = new Date()
    fim.setHours(23, 59, 59, 999)
    return { inicio, fim }
  }

  private normalizarTipo(raw: any): PontoTipoRegistro {
    const tipoNorm = String(raw || '').toUpperCase().trim()
    return tipoNorm === 'SAIDA' ? PontoTipoRegistro.SAIDA : PontoTipoRegistro.ENTRADA
  }

  private buildConviteUrl(code: string): string {
    const base = String(this.config.get('PONTO_APP_URL') ?? '').trim()
    if (!base) return ''
    return `${base.replace(/\/$/, '')}/ativar?code=${encodeURIComponent(code)}`
  }

  private assertFuncionarioAtivo(status: any) {
    if (String(status || '').toUpperCase() !== 'ATIVO') {
      throw new BadRequestException('Funcionário inativo.')
    }
  }

  private assertConviteValido(convite: any) {
    if (!convite) throw new BadRequestException('Código inválido.')
    if (convite.usado_em) throw new BadRequestException('Código já utilizado.')
    if (new Date() > convite.expira_em) throw new BadRequestException('Código expirado.')
    this.assertFuncionarioAtivo(convite.funcionario?.status)
  }

  async criarConvite(dto: CriarConviteDto) {
    let funcionario = dto.funcionario_id
      ? await this.prisma.funcionarios.findUnique({
          where: { id: dto.funcionario_id },
          select: { id: true, status: true },
        })
      : null

    if (!funcionario) {
      const criado = await this.prisma.funcionarios.create({
        data: {
          nome: 'FUNCIONARIO TESTE PONTO',
          cpf: `TESTE-${Date.now()}`,
          status: 'ATIVO',
        } as any,
        select: { id: true, status: true },
      })
      funcionario = { id: criado.id, status: criado.status }
    }

    this.assertFuncionarioAtivo(funcionario.status)

    const code = this.gerarCode()
    const minutos = Number(this.config.get('PONTO_CONVITE_MINUTOS') ?? 60)
    const expira_em = new Date(Date.now() + minutos * 60 * 1000)

    const convite = await this.prisma.ponto_convites.create({
      data: {
        funcionario_id: funcionario.id,
        code,
        expira_em,
      },
      select: { code: true, expira_em: true, funcionario_id: true },
    })

    return {
      url: this.buildConviteUrl(convite.code),
      code: convite.code,
      expira_em: convite.expira_em,
      funcionario_id: convite.funcionario_id,
    }
  }

  async ativar(dto: AtivarDto) {
    const convite = await this.prisma.ponto_convites.findUnique({
      where: { code: dto.code },
      select: {
        id: true,
        funcionario_id: true,
        expira_em: true,
        usado_em: true,
        funcionario: { select: { status: true } },
      },
    })

    this.assertConviteValido(convite)

    const { token } = await this.prisma.$transaction(async (tx) => {
      const dispositivo = await tx.ponto_dispositivos.upsert({
        where: { device_uuid: dto.device_uuid },
        create: {
          funcionario_id: convite.funcionario_id,
          device_uuid: dto.device_uuid,
          device_nome: dto.device_nome ?? null,
          plataforma: dto.plataforma ?? null,
          user_agent: dto.user_agent ?? null,
          token_hash: 'TEMP',
          status: 'ATIVO',
          ultimo_uso_em: new Date(),
        },
        update: {
          funcionario_id: convite.funcionario_id,
          status: 'ATIVO',
          ultimo_uso_em: new Date(),
        },
        select: { id: true, funcionario_id: true, device_uuid: true },
      })

      const payload = {
        tipo: 'PONTO',
        funcionario_id: dispositivo.funcionario_id,
        dispositivo_id: dispositivo.id,
        device_uuid: dispositivo.device_uuid,
      }

      const token = await this.jwt.signAsync(payload)
      const token_hash = this.hashToken(token)

      await tx.ponto_dispositivos.update({
        where: { id: dispositivo.id },
        data: { token_hash },
      })

      await tx.ponto_convites.update({
        where: { id: convite.id },
        data: { usado_em: new Date() },
      })

      return { token }
    })

    return { token }
  }

  async registrar(dto: RegistrarPontoDto, req: any) {
    const funcionario_id = this.getFuncionarioId(req)
    const dispositivo_id = this.getDispositivoId(req)
    const { inicio, fim } = this.rangeHoje()

    const ultimoHoje = await this.prisma.ponto_registros.findFirst({
      where: {
        funcionario_id,
        status: 'ATIVO',
        data_hora: { gte: inicio, lte: fim },
      },
      orderBy: { data_hora: 'desc' },
      select: { tipo: true, data_hora: true },
    })

    const tipo = this.normalizarTipo(dto.tipo)

    if (ultimoHoje?.tipo === tipo) {
      throw new BadRequestException(`O último registro já foi uma ${tipo}.`)
    }

    if (ultimoHoje?.data_hora) {
      const diffMs = Date.now() - new Date(ultimoHoje.data_hora).getTime()
      if (diffMs < 30_000) {
        throw new BadRequestException('Aguarde 30 segundos para registrar novamente.')
      }
    }

    const ip = (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null
    const user_agent = String(req.headers?.['user-agent'] || '')

    const registro = await this.prisma.ponto_registros.create({
      data: {
        funcionario_id,
        dispositivo_id,
        tipo,
        origem: PontoOrigem.PWA, // Forçando a origem conforme seu schema
        ip,
        user_agent: user_agent || null,
        status: 'ATIVO',
        observacao: dto.observacao ?? null,
        // GPS explicitamente nulo por enquanto
        latitude: null,
        longitude: null,
        precisao_metros: null,
        cep: null,
        rua: null,
        bairro: null,
        cidade: null,
        estado: null,
      },
    })

    if (dispositivo_id) {
      await this.prisma.ponto_dispositivos.update({
        where: { id: dispositivo_id },
        data: { ultimo_uso_em: new Date() },
      })
    }

    return registro
  }

  async hoje(req: any) {
    const funcionario_id = this.getFuncionarioId(req)
    const { inicio, fim } = this.rangeHoje()

    return this.prisma.ponto_registros.findMany({
      where: {
        funcionario_id,
        status: 'ATIVO',
        data_hora: { gte: inicio, lte: fim },
      },
      orderBy: { data_hora: 'asc' },
    })
  }

  async me(req: any) {
    const funcionario_id = this.getFuncionarioId(req)
    const funcionario = await this.prisma.funcionarios.findUnique({
      where: { id: funcionario_id },
      select: { id: true, nome: true, status: true },
    })

    if (!funcionario) throw new BadRequestException('Funcionário não encontrado.')
    return funcionario
  }
}