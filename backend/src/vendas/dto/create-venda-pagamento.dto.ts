import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVendaPagamentoDto {
  @IsString()
  forma_pagamento_chave: string; // DINHEIRO | PIX | DEBITO | CREDITO | ...

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor: number;

  @IsOptional()
  @IsDateString()
  data_prevista_recebimento?: string; // data entrega / data que vai receber

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  parcelas?: number;

  @IsOptional()
  @IsDateString()
  data_recebimento?: string; // quando recebeu de fato

  @IsOptional()
  @IsString()
  status_financeiro_chave?: string; // EM_ABERTO | PAGO | ...
}
