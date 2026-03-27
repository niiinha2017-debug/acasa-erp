import { IsNumber, IsOptional, IsString } from 'class-validator';

/** DTO para POST /financeiro/contas-receber/:id/receber */
export class ReceberContaReceberDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  recebido_em?: string;

  @IsOptional()
  @IsNumber()
  venda_pagamento_id?: number;

  @IsOptional()
  @IsNumber()
  parcela?: number;

  @IsOptional()
  @IsString()
  forma_recebimento_chave?: string;

  @IsOptional()
  @IsString()
  observacao?: string;
}
