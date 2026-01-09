import { 
  Body, Controller, Delete, Get, Param, Put, Post, Res, 
  UploadedFile, UseInterceptors, HttpCode, HttpStatus, BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { OrcamentosService } from './orcamentos.service';
import { CreateOrcamentoDto } from './dto/create-orcamento.dto';
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto';
import { CreateOrcamentoItemDto } from './dto/create-orcamento-item.dto';
import { UpdateOrcamentoItemDto } from './dto/update-orcamento-item.dto';

@Controller('orcamentos')
export class OrcamentosController {
  constructor(private readonly service: OrcamentosService) {}

  private cleanId(id: string): number {
    return Number(id.replace(/\D/g, ''));
  }

  @Get()
  listar() {
    return this.service.listar();
  }

  @Get(':id')
  detalhar(@Param('id') id: string) {
    return this.service.detalhar(this.cleanId(id));
  }

  @Post()
  criar(@Body() dto: CreateOrcamentoDto) {
    return this.service.criar(dto);
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dto: UpdateOrcamentoDto) {
    return this.service.atualizar(this.cleanId(id), dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(@Param('id') id: string) {
    return this.service.remover(this.cleanId(id));
  }

  @Post(':id/itens')
  adicionarItem(@Param('id') id: string, @Body() dto: CreateOrcamentoItemDto) {
    return this.service.adicionarItem(this.cleanId(id), dto);
  }

  @Put(':id/itens/:itemId')
  atualizarItem(
    @Param('id') id: string, 
    @Param('itemId') itemId: string, 
    @Body() dto: UpdateOrcamentoItemDto
  ) {
    return this.service.atualizarItem(this.cleanId(id), this.cleanId(itemId), dto);
  }

  @Delete(':id/itens/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removerItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.service.removerItem(this.cleanId(id), this.cleanId(itemId));
  }

  @Post(':id/arquivos')
  @UseInterceptors(FileInterceptor('arquivo', { limits: { fileSize: 15 * 1024 * 1024 } }))
  anexarArquivo(@Param('id') id: string, @UploadedFile() file: any) {
    return this.service.anexarArquivo(this.cleanId(id), file);
  }

  @Get(':id/pdf')
  async gerarPdf(@Param('id') id: string, @Res() res: Response) {
    const orcId = this.cleanId(id);
    const orc = await this.service.detalhar(orcId);

    // Agora o método está no Service, o erro vermelho sumiu!
    const pdfFinal = await this.service.gerarPdfCompleto(orc);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="orcamento-${orcId}.pdf"`);
    return res.end(Buffer.from(pdfFinal));
  }
}