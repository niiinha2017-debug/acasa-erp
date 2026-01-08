import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateDespesaDto {
  @IsString()
  @IsNotEmpty()
  tipo_movimento: string; // ENTRADA | SAIDA (constantes)

  @IsString()
  @IsNotEmpty()
  categoria: string; // combustivel / energia / agua / etc

  @IsString()
  @IsNotEmpty()
  classificacao: string; // custo fixo/variavel, despesa fixa/variavel

  @IsString()
  @IsNotEmpty()
  local: string; // loja / fabrica

  // aceitar como string pra manter decimal certinho (ex: "123.45")
  @IsString()
  @IsNotEmpty()
  valor_total: string;

  @IsString()
  @IsNotEmpty()
  forma_pagamento: string;

  @IsInt()
  @Min(1)
  quantidade_parcelas: number;

  @IsOptional()
  @IsDateString()
  data_registro?: string; // opcional (se não mandar, Prisma usa now())

  @IsDateString()
  data_vencimento: string;

  @IsOptional()
  @IsDateString()
  data_pagamento?: string;

  @IsOptional()
  @IsInt()
  funcionario_id?: number;

  @IsString()
  @IsNotEmpty()
  status: string;
}
