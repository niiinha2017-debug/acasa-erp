import { IsInt, IsNumber, IsString, Min } from 'class-validator';

export class EfetuarPagamentoFolhaDto {
  @IsInt()
  @Min(1)
  funcionario_id: number;

  @IsString()
  nome: string;

  @IsNumber()
  @Min(0)
  custo_devido: number;

  /** Mês de referência (1-12). */
  @IsInt()
  @Min(1)
  ref_mes: number;

  /** Ano de referência (ex.: 2025). */
  @IsInt()
  @Min(2020)
  ref_ano: number;
}
