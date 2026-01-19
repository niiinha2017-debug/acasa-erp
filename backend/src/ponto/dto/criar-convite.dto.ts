import { IsInt } from 'class-validator'
import { Type } from 'class-transformer'

export class CriarConviteDto {
  @Type(() => Number)
  @IsInt()
  funcionario_id: number
}
