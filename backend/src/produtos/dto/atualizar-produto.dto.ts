import { PartialType } from '@nestjs/mapped-types'
import { CreateProdutoDto } from './criar-produto.dto'

export class UpdateProdutoDto extends PartialType(CreateProdutoDto) {}
