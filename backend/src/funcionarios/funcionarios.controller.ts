import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Post,
  UseGuards,
  Res,
  HttpStatus
} from '@nestjs/common';
import { Response } from 'express';
import { FuncionariosService } from './funcionarios.service';
import { CriarFuncionarioDto } from './dto/criar-funcionario.dto';
import { AtualizarFuncionarioDto } from './dto/atualizar-funcionario.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GerarPdfFuncionariosDto } from './dto/gerar-pdf-funcionarios.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('funcionarios')
export class FuncionariosController {
  constructor(private readonly service: FuncionariosService) {}

  @Get()
  listar() {
    return this.service.listar();
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    const cleanId = id.replace(/\D/g, '');
    return this.service.buscarPorId(Number(cleanId));
  }

  @Post()
  criar(@Body() dto: CriarFuncionarioDto) {
    return this.service.criar(dto);
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarFuncionarioDto) {
    const cleanId = id.replace(/\D/g, '');
    return this.service.atualizar(Number(cleanId), dto);
  }

  // UNIFICADO: Apenas uma rota POST 'pdf' que atende o lote
  @Post('pdf')
  async gerarPdfLote(@Body() dto: GerarPdfFuncionariosDto, @Res() res: Response) {
    try {
      const pdfBuffer = await this.service.gerarPdf(dto.ids);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename=relatorio_funcionarios.pdf',
        'Content-Length': pdfBuffer.length,
      });

      return res.send(pdfBuffer);
    } catch (error) {
      console.error('Erro no Controller de PDF:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        message: 'Erro ao gerar PDF',
        error: error.message 
      });
    }
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    const cleanId = id.replace(/\D/g, '');
    return this.service.remover(Number(cleanId));
  }
}