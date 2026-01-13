import { IsNotEmpty, IsNumber, IsString } from 'class-validator'

export class CreateOrcamentoItemDto {
  @IsNotEmpty() @IsString()
  nome_ambiente: string

  @IsNotEmpty() @IsString()
  descricao: string

  @IsNotEmpty() @IsString()
  observacao: string

  @IsNumber()
  valor_unitario: number
}
