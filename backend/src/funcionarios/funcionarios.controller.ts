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
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { Response } from 'express'
import { FuncionariosService } from './funcionarios.service'
import { CriarFuncionarioDto } from './dto/criar-funcionario.dto'
import { AtualizarFuncionarioDto } from './dto/atualizar-funcionario.dto'
import { GerarPdfFuncionariosDto } from './dto/gerar-pdf-funcionarios.dto'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/permissions.guard'
import { Permissoes } from '../auth/permissoes.decorator'

import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { randomUUID } from 'crypto'


function storageFuncionarios() {
  return diskStorage({
    destination: process.env.UPLOADS_FUNCIONARIOS_PATH || 'uploads/funcionarios',
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname || '')
      cb(null, `${randomUUID()}${ext}`)
    },
  })
}


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

    // ===== ARQUIVOS DO FUNCIONÁRIO =====

  @Get(':id/arquivos')
  @Permissoes('funcionarios.ver')
  listarArquivos(@Param('id') id: string) {
    const cleanId = id.replace(/\D/g, '')
    return this.service.listarArquivos(Number(cleanId))
  }

  @Post(':id/arquivos')
  @Permissoes('funcionarios.editar')
  @UseInterceptors(FileInterceptor('file', { storage: storageFuncionarios() }))
  uploadArquivo(@Param('id') id: string, @UploadedFile() file?: Express.Multer.File) {
    const cleanId = id.replace(/\D/g, '')
    if (!file) throw new BadRequestException('Arquivo não enviado.')
    return this.service.uploadArquivo(Number(cleanId), file)
  }

  @Delete('arquivos/:arquivoId')
  @Permissoes('funcionarios.editar')
  removerArquivo(@Param('arquivoId') arquivoId: string) {
    const cleanId = arquivoId.replace(/\D/g, '')
    return this.service.removerArquivo(Number(cleanId))
  }
}
