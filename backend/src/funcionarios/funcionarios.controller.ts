import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Post,
  Res,
  HttpStatus,
  UseGuards,
  HttpCode,
} from '@nestjs/common'
import { Response } from 'express'
import { FuncionariosService } from './funcionarios.service'
import { CriarFuncionarioDto } from './dto/criar-funcionario.dto'
import { AtualizarFuncionarioDto } from './dto/atualizar-funcionario.dto'
import { GerarPdfFuncionariosDto } from './dto/gerar-pdf-funcionarios.dto'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/permissions.guard'
import { Permissoes } from '../auth/permissoes.decorator'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('funcionarios')
export class FuncionariosController {
  constructor(private readonly service: FuncionariosService) {}

  @Get()
  @Permissoes('funcionarios.ver')
  listar() {
    return this.service.listar()
  }

  @Post('pdf')
  @Permissoes('funcionarios.ver')
  @HttpCode(HttpStatus.OK)
  async gerarPdfLote(@Body() dto: GerarPdfFuncionariosDto, @Res() res: Response) {
    const pdfBuffer = await this.service.gerarPdf(dto.ids)

    res.status(HttpStatus.OK)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      'inline; filename="relatorio_funcionarios.pdf"',
    )
    res.setHeader('Content-Length', pdfBuffer.length)

    return res.end(pdfBuffer)
  }

  @Get(':id')
  @Permissoes('funcionarios.ver')
  buscarPorId(@Param('id') id: string) {
    const cleanId = id.replace(/\D/g, '')
    return this.service.buscarPorId(Number(cleanId))
  }

  @Post()
  @Permissoes('funcionarios.criar')
  criar(@Body() dto: CriarFuncionarioDto) {
    return this.service.criar(dto)
  }

  @Put(':id')
  @Permissoes('funcionarios.editar')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarFuncionarioDto) {
    const cleanId = id.replace(/\D/g, '')
    return this.service.atualizar(Number(cleanId), dto)
  }

  @Delete(':id')
  @Permissoes('funcionarios.excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id') id: string) {
    const cleanId = id.replace(/\D/g, '')
    return this.service.remover(Number(cleanId))
  }
}
