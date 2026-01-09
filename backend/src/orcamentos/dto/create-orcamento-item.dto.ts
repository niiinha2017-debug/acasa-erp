import { IsNotEmpty, IsNumber, IsString } from 'class-validator'

export class CreateOrcamentoItemDto {
  @IsNotEmpty()
  @IsString()
  nome_ambiente: string

  @IsNotEmpty()
  @IsString()
  descricao: string

  @IsNumber()
  valor_unitario: number

  @IsNumber()
  valor_total: number
}
