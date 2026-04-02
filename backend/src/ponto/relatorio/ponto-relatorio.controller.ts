import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissoes } from '../../auth/permissoes.decorator';
import { PontoRelatorioService } from './ponto-relatorio.service';
import { EfetuarPagamentoFolhaDto } from './dto/efetuar-pagamento-folha.dto';

@Controller('ponto/relatorio')
@UseGuards(PermissionsGuard)
@Permissoes('ponto_relatorio.ver')
export class PontoRelatorioController {
  constructor(private readonly service: PontoRelatorioService) {}

  /** Comprovante de um único registro de ponto. PDF (padrão), PNG ou JPEG via ?formato=png|jpeg */
  @Get('comprovante/:id')
  async comprovante(
    @Param('id') id: string,
    @Query('formato') formato: string,
    @Res() res: Response,
  ) {
    const registroId = Number(String(id).replace(/\D/g, ''));
    if (!registroId) {
      res.status(400).json({ message: 'ID do registro inválido' });
      return;
    }
    const fmt = String(formato || '').toLowerCase();
    if (fmt === 'png' || fmt === 'jpeg' || fmt === 'jpg') {
      const ext = fmt === 'jpg' ? 'jpeg' : fmt;
      try {
        const { buffer, contentType, ext: extReal } =
          await this.service.gerarComprovanteImageBuffer(registroId, ext);
        res.setHeader('Content-Type', contentType);
        res.setHeader(
          'Content-Disposition',
          `inline; filename="comprovante-ponto-${registroId}.${extReal}"`,
        );
        res.send(buffer);
      } catch {
        // Se PNG/JPEG falharem (ex.: sharp sem SVG), devolve comprovante em PDF
        const buffer = await this.service.gerarComprovantePdfBuffer(registroId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `inline; filename="comprovante-ponto-${registroId}.pdf"`,
        );
        res.send(buffer);
      }
      return;
    }
    const buffer = await this.service.gerarComprovantePdfBuffer(registroId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="comprovante-ponto-${registroId}.pdf"`,
    );
    res.send(buffer);
    return;
  }

  @Get('funcionarios')
  listarFuncionariosAtivos() {
    return this.service.listarFuncionariosAtivos();
  }

  @Get('fechamento')
  fechamentoFolha(
    @Query('data_ini') data_ini: string,
    @Query('data_fim') data_fim: string,
    @Query('apenas_ativos') apenas_ativos?: string,
    @Query('funcionario_id') funcionario_id?: string,
  ) {
    const funcId =
      Number(String(funcionario_id || '').replace(/\D/g, '')) || undefined;
    return this.service.fechamentoFolha({
      data_ini,
      data_fim,
      apenas_ativos: apenas_ativos !== 'false' && apenas_ativos !== '0',
      funcionario_id: funcId,
    });
  }

  /** Efetua pagamento de folha: cria despesa (SAÍDA, FOLHA) já paga e reflete em Custos de Estrutura. */
  @Post('fechamento/efetuar-pagamento')
  @Permissoes('despesas.criar')
  @HttpCode(HttpStatus.OK)
  efetuarPagamentoFolha(@Body() dto: EfetuarPagamentoFolhaDto) {
    return this.service.efetuarPagamentoFolha(dto);
  }

  @Get('feriados-config')
  listarFeriadosConfig(
    @Query('data_ini') data_ini?: string,
    @Query('data_fim') data_fim?: string,
  ) {
    return this.service.listarFeriadosConfig(data_ini, data_fim);
  }

  @Get('feriados')
  listarFeriadosNacionais(@Query('ano') ano?: string) {
    const a = ano
      ? Number(String(ano).replace(/\D/g, ''))
      : new Date().getFullYear();
    return this.service.listarFeriadosNacionais(a);
  }

  @Put('feriados-config')
  @Permissoes('ponto_relatorio.ver')
  salvarFeriadosConfig(@Body() body: { itens?: any[] } | any[]) {
    const itens = Array.isArray(body) ? body : body?.itens || [];
    return this.service.salvarFeriadosConfig(itens);
  }

  @Get('registros')
  listar(
    @Query('funcionario_id') funcionario_id?: string,
    @Query('data_ini') data_ini?: string,
    @Query('data_fim') data_fim?: string,
    @Query('tipo') tipo?: 'ENTRADA' | 'SAIDA',
    @Query('origem') origem?: 'PWA' | 'WEB' | 'ADMIN',
    @Query('status') status?: 'ATIVO' | 'INVALIDADO',
  ) {
    return this.service.listar({
      funcionario_id,
      data_ini,
      data_fim,
      tipo,
      origem,
      status,
    });
  }

  @Get('pdf')
  async pdfMensal(
    @Res() res: Response,
    @Query('funcionario_id') funcionario_id: string,
    @Query('mes') mes: string,
    @Query('ano') ano: string,
  ) {
    const funcId = Number(String(funcionario_id).replace(/\D/g, ''));
    const m = Number(String(mes).replace(/\D/g, ''));
    const a = Number(String(ano).replace(/\D/g, ''));
    const pdfBuffer = await this.service.gerarPdfMensalBuffer({
      funcionario_id: funcId,
      mes: m,
      ano: a,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="ponto-${funcId}-${a}-${String(m).padStart(2, '0')}.pdf"`,
    );
    res.send(pdfBuffer);
  }

  // ✅ NOVO: PDF + SALVAR (PWA)
  @Post('pdf')
  @Permissoes('ponto_relatorio.ver')
  @HttpCode(HttpStatus.OK)
  async pdfMensalSalvar(
    @Body() body: { funcionario_id: any; mes: any; ano: any },
  ) {
    const funcId = Number(String(body.funcionario_id ?? '').replace(/\D/g, ''));
    const m = Number(String(body.mes ?? '').replace(/\D/g, ''));
    const a = Number(String(body.ano ?? '').replace(/\D/g, ''));

    return this.service.gerarPdfMensalESalvar({
      funcionario_id: funcId,
      mes: m,
      ano: a,
    });
  }

  /** Gera recibo de folha operacional em PDF (logo A Casa + resumo + auditoria). */
  @Post('recibo-folha')
  @Permissoes('ponto_relatorio.ver')
  @HttpCode(HttpStatus.OK)
  async reciboFolhaPdf(
    @Body()
    body: {
      nome_funcionario: string;
      data_ini: string;
      data_fim: string;
      ganhos_totais: number;
      total_vales: number;
      saldo_a_pagar: number;
      itens_auditoria: Array<{
        data: string;
        descricao: string;
        tipo: 'Provento' | 'Desconto';
        valor: number;
      }>;
    },
    @Res() res: Response,
  ) {
    const buffer = await this.service.gerarReciboFolhaPdfBuffer({
      nome_funcionario: body.nome_funcionario ?? '',
      data_ini: body.data_ini ?? '',
      data_fim: body.data_fim ?? '',
      ganhos_totais: Number(body.ganhos_totais ?? 0),
      total_vales: Number(body.total_vales ?? 0),
      saldo_a_pagar: Number(body.saldo_a_pagar ?? 0),
      itens_auditoria: Array.isArray(body.itens_auditoria)
        ? body.itens_auditoria.map((i) => ({
            data: String(i?.data ?? ''),
            descricao: String(i?.descricao ?? ''),
            tipo: (i?.tipo === 'Desconto' ? 'Desconto' : 'Provento') as
              | 'Provento'
              | 'Desconto',
            valor: Number(i?.valor ?? 0),
          }))
        : [],
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="recibo-folha-${(body.nome_funcionario || 'funcionario').replace(/\s+/g, '-')}.pdf"`,
    );
    res.send(buffer);
  }
}
