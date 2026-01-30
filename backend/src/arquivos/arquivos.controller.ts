import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { Response } from 'express'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname, join } from 'path'
import * as fs from 'fs'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PermissionsGuard } from '../auth/permissions.guard'
import { Permissoes } from '../auth/permissoes.decorator'
import { ArquivosService } from './arquivos.service'

function onlySafeName(v: any) {
  return String(v ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'SEM_NOME'
}

function todayYmd() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}


@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('arquivos')
export class ArquivosController {
  constructor(private readonly arquivosService: ArquivosService) {}

  // LISTAR (filtrado)
  @Get()
  @Permissoes('arquivos.ver')
  listar(
    @Query('owner_type') owner_type: string,
    @Query('owner_id') owner_id: string,
    @Query('categoria') categoria?: string,
  ) {
    const oid = Number(String(owner_id || '').replace(/\D/g, ''))
    if (!owner_type || !oid) {
      throw new BadRequestException('owner_type e owner_id são obrigatórios.')
    }
    return this.arquivosService.listar({ owner_type, owner_id: oid, categoria })
  }

  // UPLOAD GLOBAL
  @Post('upload')
  @Permissoes('arquivos.criar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, _file, cb) => {
          const ot = String((req as any).body?.owner_type || '').trim().toUpperCase()
          const folder = ot ? ot.toLowerCase() + 's' : 'geral'
          const dir = `./uploads/${folder}`
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
          cb(null, dir)
        },
filename: (req, file, cb) => {
  const body: any = (req as any)?.body || {}

  const ownerType = String(body.owner_type || '').trim().toUpperCase()
  const prefixo = onlySafeName(body.prefixo || ownerType || 'ARQUIVO')
  const nomeBase = onlySafeName(body.nome_base || body.cliente_nome || body.nome || '')

  const data = todayYmd()
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  const ext = extname(file.originalname || '')

  // ex: ORCAMENTO_MARIA_SILVA_2026-01-28_A1B2C3.pdf
  const finalName = nomeBase
    ? `${prefixo}_${nomeBase}_${data}_${rand}${ext}`
    : `${prefixo}_${data}_${rand}${ext}`

  cb(null, finalName)
},

      }),
      limits: { fileSize: 500 * 1024 * 1024 }, // 500MB (ajuste se quiser)
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('owner_type') _owner_type_q: string, // não usado (só pra não confundir)
    @Res({ passthrough: true }) res: Response,
    @Query() _q: any,
  ) {
    // owner_type/owner_id/categoria/slot_key vêm no body do multipart
    const body: any = (res.req as any)?.body || {}

    if (!file) throw new BadRequestException('Arquivo não enviado.')

return this.arquivosService.salvarUpload({
  owner_type: body.owner_type,
  owner_id: body.owner_id, // <- aqui não converte pra número nem valida
  categoria: body.categoria ?? null,
  slot_key: body.slot_key ?? null,
  file,
})

  }

  // BAIXAR COMO BLOB (PWA-friendly)
  @Get(':id/blob')
  @Permissoes('arquivos.ver')
  async baixarBlob(@Param('id') id: string, @Res() res: Response) {
    const cleanId = Number(String(id).replace(/\D/g, ''))
    if (!cleanId) throw new BadRequestException('ID inválido.')

    const arquivo = await this.arquivosService.buscarPorId(cleanId)

    // arquivo.url: "/uploads/xxx/arquivo.ext"
    const rel = String(arquivo.url || '').replace(/^\//, '') // "uploads/.."
    const abs = join(process.cwd(), rel)

    if (!fs.existsSync(abs)) throw new BadRequestException('Arquivo físico não encontrado.')

    res.setHeader('Content-Type', arquivo.mime_type || 'application/octet-stream')
    res.setHeader('Content-Disposition', `inline; filename="${arquivo.filename}"`)
    return res.sendFile(abs)
  }

  // REMOVER
  @Delete(':id')
  @Permissoes('arquivos.excluir')
  remover(@Param('id') id: string) {
    const cleanId = Number(String(id).replace(/\D/g, ''))
    return this.arquivosService.remover(cleanId)
  }
}
