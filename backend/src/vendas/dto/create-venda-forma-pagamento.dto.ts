import { IsString, IsNumber, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** Uma forma de pagamento agrupada (ex.: R$ 5.000 em 15x com juros + R$ 10.000 PIX à vista) para o contrato. */
export class CreateVendaFormaPagamentoDto {
  @IsString()
  forma_pagamento_chave: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_base: number; // valor sem juros desta parte (para o contrato)

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantidade_parcelas: number; // 1 = à vista

  @Type(() => Boolean)
  @IsBoolean()
  com_juros: boolean;
}
