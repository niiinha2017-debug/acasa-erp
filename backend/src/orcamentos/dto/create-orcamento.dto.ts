import { IsInt } from 'class-validator'

export class CreateOrcamentoDto {
  @IsInt()
  cliente_id: number
}
