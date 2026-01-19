import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator'

export class CreateOrcamentoItemDto {
  @IsNotEmpty()
  @IsString()
  nome_ambiente: string

  @IsNotEmpty()
  @IsString()
  descricao: string

  @IsNotEmpty()
  @IsString()
  observacao: string

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_unitario: number

  @Type(() => Number)
@IsNumber()
@Min(0)
valor_total: number

}
