import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
  BadRequestException, 
  Res,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'


import { VendasService } from './vendas.service'
import { CreateVendaDto } from './dto/create-venda.dto'
import { UpdateVendaDto } from './dto/update-venda.dto'
import { UpdateVendaStatusDto } from './dto/update-venda-status.dto'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/permissions.guard'
import { Permissoes } from '../auth/permissoes.decorator'

import { UpdateVendaItemDto } from './dto/update-venda-item.dto'


@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('vendas')
export class VendasController {
  constructor(private readonly service: VendasService) {}

  private cleanId(id: string | number): number {
    const n = Number(String(id || '').replace(/\D/g, ''))
    return Number.isFinite(n) ? n : 0
  }

  @Get()
  @Permissoes('vendas.ver')
  listar() {
    return this.service.listar()
  }

  @Get(':id')
  @Permissoes('vendas.ver')
  buscar(@Param('id') id: string) {
    return this.service.buscarPorId(this.cleanId(id))
  }

  @Post()
  @Permissoes('vendas.criar')
  criar(@Body() dto: CreateVendaDto) {
    return this.service.criar(dto)
  }

  @Put(':id')
  @Permissoes('vendas.editar')
  atualizar(@Param('id') id: string, @Body() dto: UpdateVendaDto) {
    return this.service.atualizar(this.cleanId(id), dto)
  }

  @Put(':id/status')
  @Permissoes('vendas.editar')
  atualizarStatus(@Param('id') id: string, @Body() dto: UpdateVendaStatusDto) {
    return this.service.atualizarStatus(this.cleanId(id), dto.status)
  }

  @Delete(':id')
  @Permissoes('vendas.excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id') id: string) {
    return this.service.remover(this.cleanId(id))
  }

  @Put(':id/itens/:itemId')
  @Permissoes('vendas.editar')
  atualizarItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateVendaItemDto,
  ) {
    return this.service.atualizarItem(this.cleanId(id), this.cleanId(itemId), dto)
  }

@Post(':id/enviar-producao')
@Permissoes('vendas.editar')
enviarParaProducao() {
  throw new BadRequestException('Produção é controlada pela Agenda (Produção).')
}


  @Post(':id/arquivos')
  @Permissoes('vendas.editar')
  @UseInterceptors(
    FileInterceptor('arquivo', {
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  anexarArquivo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Arquivo é obrigatório.')
    return this.service.anexarArquivo(this.cleanId(id), file)
  }

  @Get(':id/arquivos')
  @Permissoes('vendas.ver')
  listarArquivos(@Param('id') id: string) {
    return this.service.listarArquivos(this.cleanId(id))
  }

  @Get(':id/arquivos/:arquivoId')
  @Permissoes('vendas.ver')
  async abrirArquivo(
    @Param('id') id: string,
    @Param('arquivoId') arquivoId: string,
    @Res() res: Response,
  ) {
    const vendaId = this.cleanId(id)
    const arqId = this.cleanId(arquivoId)

    const { arq, abs } = await this.service.obterArquivo(vendaId, arqId)

    res.setHeader('Content-Type', arq.mime_type)
    res.setHeader('Content-Disposition', `inline; filename="${arq.nome_original}"`)
    return res.sendFile(abs)
  }

  @Delete(':id/arquivos/:arquivoId')
  @Permissoes('vendas.editar')
  @HttpCode(HttpStatus.NO_CONTENT)
  removerArquivo(
    @Param('id') id: string,
    @Param('arquivoId') arquivoId: string,
  ) {
    return this.service.removerArquivo(this.cleanId(id), this.cleanId(arquivoId))
  }
}

