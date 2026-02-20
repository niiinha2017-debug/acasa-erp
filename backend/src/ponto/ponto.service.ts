import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CriarConviteDto } from './dto/criar-convite.dto';
import { AtivarDto } from './dto/ativar.dto';
import { RegistrarPontoDto } from './dto/registrar-ponto.dto';
import { createHash, randomBytes } from 'crypto';
import { PontoTipoRegistro, PontoOrigem } from '@prisma/client';

@Injectable()
export class PontoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private gerarCode(): string {
    return randomBytes(6).toString('hex').toUpperCase();
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getFuncionarioId(req: any): number {
    const ponto = req.ponto || {};
    const funcionario_id = Number(ponto.funcionario_id);
    if (!funcionario_id)
      throw new BadRequestException('Token inválido (funcionário).');
    return funcionario_id;
  }

  private getDispositivoId(req: any): number | null {
    const ponto = req.ponto || {};
    const dispositivo_id = ponto.dispositivo_id
      ? Number(ponto.dispositivo_id)
      : null;
    return dispositivo_id || null;
  }

  /** Range do dia atual em America/Sao_Paulo (BRT) para registrar/listar ponto */
  private rangeHoje() {
    const now = new Date();
    const ymd = now.toLocaleDateString('en-CA', {
      timeZone: 'America/Sao_Paulo',
    });
    return {
      inicio: new Date(`${ymd}T00:00:00.000-03:00`),
      fim: new Date(`${ymd}T23:59:59.999-03:00`),
    };
  }

  private normalizarTipo(raw: any): PontoTipoRegistro {
    const tipoNorm = String(raw || '')
      .toUpperCase()
      .trim();
    return tipoNorm === 'SAIDA'
      ? PontoTipoRegistro.SAIDA
      : PontoTipoRegistro.ENTRADA;
  }

  private buildConviteUrl(code: string): string {
    const rawBase = String(this.config.get('PONTO_APP_URL') ?? '').trim();
    const fallback = 'https://ponto.acasamarcenaria.com.br';
    const base = rawBase || fallback;
    const normalized =
      base.startsWith('http://') || base.startsWith('https://')
        ? base
        : `https://${base}`;
    return `${normalized.replace(/\/+$/, '')}/ativar?code=${encodeURIComponent(code)}`;
  }

  private buildApkUrl(): string {
    const rawApk = String(this.config.get('PONTO_APK_URL') ?? '').trim();
    if (rawApk) return rawApk;

    const rawBase = String(this.config.get('PONTO_APP_URL') ?? '').trim();
    const fallbackBase = 'https://ponto.acasamarcenaria.com.br';
    const base = rawBase || fallbackBase;
    const normalized =
      base.startsWith('http://') || base.startsWith('https://')
        ? base
        : `https://${base}`;

    // APK fica em /ponto.apk na raiz do subdomínio
    return `${normalized.replace(/\/+$/, '')}/ponto.apk`;
  }

  private assertFuncionarioAtivo(status: any) {
    if (String(status || '').toUpperCase() !== 'ATIVO') {
      throw new BadRequestException('Funcionário inativo.');
    }
  }

  private async assertFuncionarioAtivoParaPonto(funcionario_id: number) {
    const funcionario = await this.prisma.funcionarios.findUnique({
      where: { id: funcionario_id },
      select: { status: true, demissao: true },
    });
    if (!funcionario)
      throw new BadRequestException('Funcionário não encontrado.');

    if (String(funcionario.status || '').toUpperCase() !== 'ATIVO') {
      throw new BadRequestException('Funcionário inativo.');
    }

    if (funcionario.demissao && funcionario.demissao <= new Date()) {
      throw new BadRequestException('Funcionário desligado.');
    }
  }

  private assertConviteValido(convite: any) {
    if (!convite) throw new BadRequestException('Código inválido.');
    if (convite.usado_em) throw new BadRequestException('Código já utilizado.');
    if (new Date() > convite.expira_em)
      throw new BadRequestException('Código expirado.');
    this.assertFuncionarioAtivo(convite.funcionario?.status);
  }

  // --- MÉTODOS PÚBLICOS ---

  async criarConvite(dto: CriarConviteDto) {
    let funcionario = dto.funcionario_id
      ? await this.prisma.funcionarios.findUnique({
          where: { id: dto.funcionario_id },
          select: { id: true, status: true },
        })
      : null;

    if (!funcionario) {
      const criado = await this.prisma.funcionarios.create({
        data: {
          nome: 'FUNCIONARIO TESTE PONTO',
          cpf: `TESTE-${Date.now()}`,
          status: 'ATIVO',
        } as any,
        select: { id: true, status: true },
      });
      funcionario = { id: criado.id, status: criado.status };
    }

    this.assertFuncionarioAtivo(funcionario.status);

    const code = this.gerarCode();
    const minutos = Number(this.config.get('PONTO_CONVITE_MINUTOS') ?? 60);
    const expira_em = new Date(Date.now() + minutos * 60 * 1000);

    const convite = await this.prisma.ponto_convites.create({
      data: {
        funcionario_id: funcionario.id,
        code,
        expira_em,
      },
      select: { code: true, expira_em: true, funcionario_id: true },
    });

    return {
      url: this.buildConviteUrl(convite.code),
      apk_url: this.buildApkUrl(),
      code: convite.code,
      expira_em: convite.expira_em,
      funcionario_id: convite.funcionario_id,
    };
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
    });

    this.assertConviteValido(convite);

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
      });

      const payload = {
        tipo: 'PONTO',
        funcionario_id: dispositivo.funcionario_id,
        dispositivo_id: dispositivo.id,
        device_uuid: dispositivo.device_uuid,
      };

      // Token do app de Ponto: pensado para ser de longa duração.
      // Usa PONTO_JWT_EXPIRES (ex: "365d", "3650d") ou cai no padrão de 10 anos.
      const pontoExpires =
        this.config.get<string>('PONTO_JWT_EXPIRES')?.trim() || '3650d';
      const token = await this.jwt.signAsync(payload, {
        expiresIn: pontoExpires as any,
      });
      const token_hash = this.hashToken(token);

      await tx.ponto_dispositivos.update({
        where: { id: dispositivo.id },
        data: { token_hash },
      });

      await tx.ponto_convites.update({
        where: { id: convite.id },
        data: { usado_em: new Date() },
      });

      return { token };
    });

    return { token };
  }

  async registrar(dto: RegistrarPontoDto, req: any) {
    const funcionario_id = this.getFuncionarioId(req);
    await this.assertFuncionarioAtivoParaPonto(funcionario_id);
    const dispositivo_id = this.getDispositivoId(req);
    const { inicio, fim } = this.rangeHoje();

    const ultimoHoje = await this.prisma.ponto_registros.findFirst({
      where: {
        funcionario_id,
        status: 'ATIVO',
        data_hora: { gte: inicio, lte: fim },
      },
      orderBy: { data_hora: 'desc' },
      select: { tipo: true, data_hora: true },
    });

    const tipo = this.normalizarTipo(dto.tipo);

    if (ultimoHoje?.tipo === tipo) {
      throw new BadRequestException(`O último registro já foi uma ${tipo}.`);
    }

    if (ultimoHoje?.data_hora) {
      const diffMs = Date.now() - new Date(ultimoHoje.data_hora).getTime();
      if (diffMs < 30_000) {
        throw new BadRequestException(
          'Aguarde 30 segundos para registrar novamente.',
        );
      }
    }

    const ip =
      (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      null;
    const user_agent = String(req.headers?.['user-agent'] || '');

    const registro = await this.prisma.ponto_registros.create({
      data: {
        funcionario_id,
        dispositivo_id,
        tipo,
        origem: PontoOrigem.PWA,
        ip,
        user_agent: user_agent || null,
        status: 'ATIVO',
        observacao: dto.observacao ?? null,
        latitude: null,
        longitude: null,
        precisao_metros: null,
        cep: null,
        rua: null,
        bairro: null,
        cidade: null,
        estado: null,
      },
    });

    if (dispositivo_id) {
      await this.prisma.ponto_dispositivos.update({
        where: { id: dispositivo_id },
        data: { ultimo_uso_em: new Date() },
      });
    }

    const transacao_id = createHash('sha256')
      .update(`${registro.id}|${registro.data_hora.toISOString()}|${registro.funcionario_id}`)
      .digest('hex')
      .slice(0, 32);
    return { ...registro, transacao_id };
  }

  private transacaoId(registro: {
    id: number;
    data_hora: Date;
    funcionario_id: number;
  }): string {
    return createHash('sha256')
      .update(`${registro.id}|${new Date(registro.data_hora).toISOString()}|${registro.funcionario_id}`)
      .digest('hex')
      .slice(0, 32);
  }

  /** Retorna label do tipo: Entrada, Almoço (1ª saída do dia) ou Saída */
  private tipoLabel(registrosDia: { id: number; tipo: string; data_hora: Date }[], registro: { id: number; tipo: string }): string {
    if (registro.tipo === 'ENTRADA') return 'Entrada';
    if (registro.tipo !== 'SAIDA') return registro.tipo;
    const saidas = registrosDia.filter((r) => r.tipo === 'SAIDA').sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
    const idx = saidas.findIndex((r) => r.id === registro.id);
    return idx === 0 ? 'Almoço' : 'Saída';
  }

  async hoje(req: any) {
    const funcionario_id = this.getFuncionarioId(req);
    await this.assertFuncionarioAtivoParaPonto(funcionario_id);
    const { inicio, fim } = this.rangeHoje();

    const registros = await this.prisma.ponto_registros.findMany({
      where: {
        funcionario_id,
        status: 'ATIVO',
        data_hora: { gte: inicio, lte: fim },
      },
      orderBy: { data_hora: 'asc' },
    });

    return registros.map((r) => ({
      ...r,
      transacao_id: this.transacaoId(r),
      tipo_label: this.tipoLabel(registros, r),
    }));
  }

  async ultimo(req: any) {
    const funcionario_id = this.getFuncionarioId(req);
    await this.assertFuncionarioAtivoParaPonto(funcionario_id);
    const { inicio, fim } = this.rangeHoje();

    return this.prisma.ponto_registros.findFirst({
      where: {
        funcionario_id,
        status: 'ATIVO',
        data_hora: { gte: inicio, lte: fim },
      },
      orderBy: { data_hora: 'desc' },
      select: {
        id: true,
        tipo: true,
        data_hora: true,
        observacao: true,
      },
    });
  }

  async me(req: any) {
    const funcionario_id = this.getFuncionarioId(req);
    const funcionario = await this.prisma.funcionarios.findUnique({
      where: { id: funcionario_id },
      select: {
        id: true,
        nome: true,
        status: true,
        demissao: true,
        cpf: true,
        pis: true,
      },
    });

    if (!funcionario)
      throw new BadRequestException('Funcionário não encontrado.');

    if (String(funcionario.status || '').toUpperCase() !== 'ATIVO') {
      throw new BadRequestException('Funcionário inativo.');
    }

    if (funcionario.demissao && funcionario.demissao <= new Date()) {
      throw new BadRequestException('Funcionário desligado.');
    }

    const empresa = await this.prisma.empresa.findUnique({
      where: { id: 1 },
      select: {
        razao_social: true,
        nome_fantasia: true,
        cnpj: true,
      },
    });

    const empresaPayload = empresa
      ? {
          nome: empresa.razao_social || empresa.nome_fantasia || 'Empresa',
          cnpj: empresa.cnpj || '',
        }
      : { nome: 'Empresa', cnpj: '' };

    return {
      ...funcionario,
      empresa: empresaPayload,
    };
  }
}
