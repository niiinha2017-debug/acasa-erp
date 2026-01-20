import { IsInt, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'

export class CriarConviteDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  funcionario_id?: number
}
