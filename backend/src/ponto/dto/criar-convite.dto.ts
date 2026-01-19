import { IsInt } from 'class-validator'

export class CriarConviteDto {
  @IsInt()
  funcionario_id: number
}
