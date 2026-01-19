import { IsInt, IsNumber, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class CreatePlanoCorteConsumoDto {
  @Type(() => Number)
  @IsInt()
  plano_corte_id: number

  @Type(() => Number)
  @IsInt()
  produto_id: number

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantidade: number
}
