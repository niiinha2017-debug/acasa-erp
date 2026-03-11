import { IsOptional, IsString } from 'class-validator';

/** DTO para POST /financeiro/contas-receber/:id/receber */
export class ReceberContaReceberDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  recebido_em?: string;
}
