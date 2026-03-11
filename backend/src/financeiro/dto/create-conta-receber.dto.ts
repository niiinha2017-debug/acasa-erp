import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateContaReceberDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fornecedor_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cliente_id?: number;

  @IsOptional()
  @IsString()
  origem_tipo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  origem_id?: number;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  observacao?: string;

  @IsOptional()
  valor_original?: number;

  @IsOptional()
  valor_compensado?: number;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  forma_recebimento_chave?: string;

  @IsOptional()
  @IsString()
  vencimento_em?: string;

  @IsOptional()
  @IsString()
  recebido_em?: string;
}
