import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'

import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionsGuard } from '../../auth/permissions.guard'
import { Permissoes } from '../../auth/permissoes.decorator'

import { PontoJustificativasService } from './ponto-justificativas.service'
import { SalvarPontoJustificativaDto } from '../justificativa/salvar-ponto-justificativa.dto'

@Controller('ponto/justificativas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PontoJustificativasController {
  constructor(private readonly service: PontoJustificativasService) {}

  @Get()
  @Permissoes('PONTO_RELATORIO.ver')
  listar(
    @Query('funcionario_id') funcionario_id?: string,
    @Query('mes') mes?: string,
    @Query('ano') ano?: string,
  ) {
    return this.service.listar({ funcionario_id, mes, ano })
  }

  @Put()
  @Permissoes('PONTO_RELATORIO.editar')
  salvar(@Body() dto: SalvarPontoJustificativaDto) {
    return this.service.salvar(dto)
  }

  @Delete(':id')
  @Permissoes('PONTO_RELATORIO.editar')
  remover(@Param('id') id: string) {
    const cleanId = Number(String(id).replace(/\D/g, ''))
    return this.service.remover(cleanId)
  }

  @Post(':id/arquivos')
  @Permissoes('PONTO_RELATORIO.editar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) =>
          cb(null, 'uploads/ponto/justificativas'),
        filename: (req, file, cb) => {
          const safeBase = String(file.originalname || 'arquivo')
            .replace(/[^\w.-]+/g, '_')
            .slice(0, 150)

          cb(null, `${Date.now()}${extname(safeBase)}`)
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadArquivo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const justificativaId = Number(String(id).replace(/\D/g, ''))
    return this.service.anexarArquivo(justificativaId, file)
  }

  @Delete('arquivos/:id')
  @Permissoes('PONTO_RELATORIO.editar')
  removerArquivo(@Param('id') id: string) {
    const cleanId = Number(String(id).replace(/\D/g, ''))
    return this.service.removerArquivo(cleanId)
  }
}
