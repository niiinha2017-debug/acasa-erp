import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { CriarConviteDto } from './dto/criar-convite.dto'
import { AtivarDto } from './dto/ativar.dto'
import { RegistrarPontoDto } from './dto/registrar-ponto.dto'
import { createHash, randomBytes } from 'crypto'

@Injectable()
export class PontoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}


private normalizeCep(cep: any): string | null {
  const v = String(cep ?? '').replace(/\D/g, '')
  return v.length === 8 ? v : null
}


private ufFromState(state: string | null): string | null {
  if (!state) return null

  const map: Record<string, string> = {
    'ACRE': 'AC',
    'ALAGOAS': 'AL',
    'AMAPA': 'AP',
    'AMAZONAS': 'AM',
    'BAHIA': 'BA',
    'CEARA': 'CE',
    'DISTRITO FEDERAL': 'DF',
    'ESPIRITO SANTO': 'ES',
    'GOIAS': 'GO',
    'MARANHAO': 'MA',
    'MATO GROSSO': 'MT',
    'MATO GROSSO DO SUL': 'MS',
    'MINAS GERAIS': 'MG',
    'PARA': 'PA',
    'PARAIBA': 'PB',
    'PARANA': 'PR',
    'PERNAMBUCO': 'PE',
    'PIAUI': 'PI',
    'RIO DE JANEIRO': 'RJ',
    'RIO GRANDE DO NORTE': 'RN',
    'RIO GRANDE DO SUL': 'RS',
    'RONDONIA': 'RO',
    'RORAIMA': 'RR',
    'SANTA CATARINA': 'SC',
    'SAO PAULO': 'SP',
    'SERGIPE': 'SE',
    'TOCANTINS': 'TO',
  }

  const key = String(state)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  return map[key] || null
}

private async reverseGeocode(lat: number, lng: number): Promise<{
  cep: string | null
  rua: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
}> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lng))
    url.searchParams.set('zoom', '18')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('accept-language', 'pt-BR')

    const res = await fetch(url.toString(), {
      headers: {
        // obrigatório no Nominatim: identificar o app
        'User-Agent': 'ACASA-PONTO/1.0 (suporte@acasamarcenaria.com.br)',
      },
    })

    if (!res.ok) return { cep: null, rua: null, bairro: null, cidade: null, estado: null }

    const data: any = await res.json()
    const a = data?.address || {}

    const cep = this.normalizeCep(a.postcode)

    const rua = a.road || a.pedestrian || a.footway || a.path || a.highway || null
    const bairro = a.suburb || a.neighbourhood || a.quarter || a.city_district || null
    const cidade = a.city || a.town || a.village || a.municipality || a.county || null
    const uf = a.state_code || this.ufFromState(a.state) || null

    return {
      cep,
      rua: rua ? String(rua).slice(0, 150) : null,
      bairro: bairro ? String(bairro).slice(0, 120) : null,
      cidade: cidade ? String(cidade).slice(0, 120) : null,
      estado: uf ? String(uf).slice(0, 2).toUpperCase() : null,
    }
  } catch {
    return { cep: null, rua: null, bairro: null, cidade: null, estado: null }
  }
}

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

  private normalizarTipo(raw: any): 'ENTRADA' | 'SAIDA' {
    const tipoNorm = String(raw || '')
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()

    return tipoNorm === 'SAIDA' ? 'SAIDA' : 'ENTRADA'
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

  private mapDeviceCreate(dto: AtivarDto, funcionario_id: number) {
    return {
      funcionario_id,
      device_uuid: dto.device_uuid,
      device_nome: dto.device_nome ?? null,
      plataforma: dto.plataforma ?? null,

      user_agent: dto.user_agent ?? null,
      language: dto.language ?? null,
      timezone: dto.timezone ?? null,
      screen: dto.screen ?? null,
      pixel_ratio: dto.pixel_ratio ?? null,
      standalone: dto.standalone ?? false,

      token_hash: 'TEMP', // será substituído logo após gerar o JWT
      status: 'ATIVO',
      ultimo_uso_em: new Date(),
    }
  }

  private mapDeviceUpdate(dto: AtivarDto, funcionario_id: number) {
    return {
      funcionario_id,
      device_nome: dto.device_nome ?? undefined,
      plataforma: dto.plataforma ?? undefined,

      user_agent: dto.user_agent ?? undefined,
      language: dto.language ?? undefined,
      timezone: dto.timezone ?? undefined,
      screen: dto.screen ?? undefined,
      pixel_ratio: dto.pixel_ratio ?? undefined,
      standalone: dto.standalone ?? undefined,

      status: 'ATIVO',
      ultimo_uso_em: new Date(),
    }
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
        create: this.mapDeviceCreate(dto, convite.funcionario_id),
        update: this.mapDeviceUpdate(dto, convite.funcionario_id),
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
cep: true,
rua: true,
bairro: true,
cidade: true,
estado: true,

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

    const tipo = this.normalizarTipo((dto as any)?.tipo)

    if (ultimoHoje?.tipo === tipo) {
      throw new BadRequestException(`O último registro já foi uma ${tipo}.`)
    }

    if (ultimoHoje?.data_hora) {
      const diffMs = Date.now() - new Date(ultimoHoje.data_hora).getTime()
      if (diffMs < 30_000) {
        throw new BadRequestException('Aguarde 30 segundos para registrar novamente.')
      }
    }

    const ip =
      (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null
    const user_agent = String(req.headers?.['user-agent'] || '')

  let geo = { cep: null, rua: null, bairro: null, cidade: null, estado: null }

if (dto.latitude != null && dto.longitude != null) {
  geo = await this.reverseGeocode(Number(dto.latitude), Number(dto.longitude))
}


const registro = await this.prisma.ponto_registros.create({
  data: {
    funcionario_id,
    dispositivo_id,
    tipo,
    latitude: dto.latitude ?? null,
    longitude: dto.longitude ?? null,
    precisao_metros: dto.precisao_metros ?? null,

    // ✅ endereço resolvido no backend
    cep: geo.cep,
    rua: geo.rua,
    bairro: geo.bairro,
    cidade: geo.cidade,
    estado: geo.estado,

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
    rua: true,
    bairro: true,
    cidade: true,
    estado: true,

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
        cep: true,
rua: true,
bairro: true,
cidade: true,
estado: true,

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
