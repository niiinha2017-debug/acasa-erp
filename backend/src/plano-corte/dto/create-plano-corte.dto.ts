import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

class CreatePlanoCorteProdutoDto {
  @Type(() => Number)
  @IsInt()
  item_id: number

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantidade: number

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_unitario: number

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_total: number

  @IsString()
  status: string
}

export class CreatePlanoCorteDto {
  @Type(() => Number)
  @IsInt()
  fornecedor_id: number

  @IsDateString()
  data_venda: string

  @IsString()
  status: string

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreatePlanoCorteProdutoDto)
  produtos: CreatePlanoCorteProdutoDto[]
}
