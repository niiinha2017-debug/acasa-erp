import { PartialType } from '@nestjs/mapped-types'
import { CreateFornecedorDto } from './criar-fornecedor.dto'

export class UpdateFornecedorDto extends PartialType(CreateFornecedorDto) {}
