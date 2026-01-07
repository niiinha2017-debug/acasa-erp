import { PartialType } from '@nestjs/mapped-types'
import { CriarConstanteDto } from './criar-constante.dto'

export class AtualizarConstanteDto extends PartialType(CriarConstanteDto) {}
