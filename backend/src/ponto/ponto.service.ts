import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { CriarConviteDto } from './dto/criar-convite.dto'
import { AtivarDto } from './dto/ativar.dto'
import { createHash, randomBytes } from 'crypto'
import { RegistrarPontoDto } from './dto/registrar-ponto.dto'

@Injectable()
export class PontoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private gerarCode(): string {
    return randomBytes(6).toString('hex').toUpperCase() // 12 chars
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

  async criarConvite(dto: CriarConviteDto) {
    // ✅ Se veio funcionario_id e existir, usa ele
    let funcionario = dto.funcionario_id
      ? await this.prisma.funcionarios.findUnique({
          where: { id: dto.funcionario_id },
          select: { id: true, status: true },
        })
      : null

    // ✅ Se NÃO existe, cria um de teste
    if (!funcionario) {
      const criado = await this.prisma.funcionarios.create({
        data: {
          nome: 'FUNCIONARIO TESTE PONTO',
          cpf: `TESTE-${Date.now()}`, // unique
          status: 'ATIVO',
        } as any,
        select: { id: true, status: true },
      })
      funcionario = { id: criado.id, status: criado.status }
    }

    // ✅ bloqueio básico: funcionário inativo não pode parear
    if (String(funcionario.status || '').toUpperCase() !== 'ATIVO') {
      throw new BadRequestException('Funcionário inativo.')
    }

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

    const base = String(this.config.get('PONTO_APP_URL') ?? '').trim()
    const url = base
      ? `${base.replace(/\/$/, '')}/ativar?code=${encodeURIComponent(convite.code)}`
      : ''

    return {
      url,
      code: convite.code,
      expira_em: convite.expira_em,
      funcionario_id: convite.funcionario_id,
    }
  }

  async ativar(dto: AtivarDto) {
    const convite = await this.prisma.ponto_convites.findUnique({
      where: { code: dto.code },
      select: { id: true, funcionario_id: true, expira_em: true, usado_em: true, funcionario: { select: { status: true } } },
    })

    if (!convite) throw new BadRequestException('Código inválido.')
    if (convite.usado_em) throw new BadRequestException('Código já utilizado.')
    if (new Date() > convite.expira_em) throw new BadRequestException('Código expirado.')
    if (String(convite.funcionario?.status || '').toUpperCase() !== 'ATIVO') {
      throw new BadRequestException('Funcionário inativo.')
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const dispositivo = await tx.ponto_dispositivos.upsert({
        where: { device_uuid: dto.device_uuid },
        create: {
          funcionario_id: convite.funcionario_id,
          device_uuid: dto.device_uuid,
          device_nome: dto.device_nome ?? null,
          plataforma: dto.plataforma ?? null,
          token_hash: 'TEMP',
          status: 'ATIVO',
          ultimo_uso_em: new Date(),
        },
        update: {
          funcionario_id: convite.funcionario_id,
          device_nome: dto.device_nome ?? undefined,
          plataforma: dto.plataforma ?? undefined,
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

    return { token: result.token }
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
      select: {
        id: true,
        tipo: true,
        origem: true,
        data_hora: true,
        latitude: true,
        longitude: true,
        precisao_metros: true,
        observacao: true,
      },
    })
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

  // ✅ NORMALIZA tipo (ENTRADA / SAIDA) antes de qualquer coisa
  const tipoRaw = String((dto as any)?.tipo || '')
  const tipoNorm = tipoRaw
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // tira acentos
    .trim()

  const tipo: 'ENTRADA' | 'SAIDA' =
    tipoNorm === 'SAIDA' ? 'SAIDA' : 'ENTRADA'

  // ✅ BLOQUEIO: evita duas iguais seguidas
  if (ultimoHoje?.tipo === tipo) {
    throw new BadRequestException(`O último registro já foi uma ${tipo}.`)
  }

  // ✅ BLOQUEIO: double tap 30s
  if (ultimoHoje?.data_hora) {
    const diffMs = Date.now() - new Date(ultimoHoje.data_hora).getTime()
    if (diffMs < 30_000) {
      throw new BadRequestException('Aguarde 30 segundos para registrar novamente.')
    }
  }

  const ip =
    (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null
  const user_agent = String(req.headers?.['user-agent'] || '')

  const cep = dto.cep ? String(dto.cep).replace(/\D/g, '').slice(0, 8) : null
  const localidade = dto.localidade ? String(dto.localidade).trim().slice(0, 150) : null

  const registro = await this.prisma.ponto_registros.create({
    data: {
      funcionario_id,
      dispositivo_id,
      tipo, // ✅ agora sempre ENTRADA|SAIDA (sem acento)
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      precisao_metros: dto.precisao_metros ?? null,
      cep,
      localidade,
      ip,
      user_agent: user_agent || null,
      status: 'ATIVO',
      observacao: dto.observacao ?? null,
    },
    select: {
      id: true,
      funcionario_id: true,
      tipo: true,
      data_hora: true,
      latitude: true,
      longitude: true,
      precisao_metros: true,
      cep: true,
      localidade: true,
      status: true,
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


  async ultimo(req: any) {
    const funcionario_id = this.getFuncionarioId(req)

    return this.prisma.ponto_registros.findFirst({
      where: { funcionario_id, status: 'ATIVO' },
      orderBy: { data_hora: 'desc' },
      select: {
        id: true,
        funcionario_id: true,
        dispositivo_id: true,
        tipo: true,
        origem: true,
        data_hora: true,
        latitude: true,
        longitude: true,
        precisao_metros: true,
        ip: true,
        user_agent: true,
        status: true,
        observacao: true,
        criado_em: true,
      },
    })
  }
  async me(req: any) {
  const funcionario_id = this.getFuncionarioId(req)

  const funcionario = await this.prisma.funcionarios.findUnique({
    where: { id: funcionario_id },
    select: {
      id: true,
      nome: true,
      status: true,
    },
  })

  if (!funcionario) {
    throw new BadRequestException('Funcionário não encontrado.')
  }

  return funcionario
}

}
