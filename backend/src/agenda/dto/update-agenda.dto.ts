import { IsArray, IsDateString, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FuncionarioApontamentoDto } from './create-agenda.dto';

export class UpdateAgendaDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data de início inválida' })
  inicio_em?: Date;

  @IsOptional()
  @IsDateString({}, { message: 'Data de término inválida' })
  fim_em?: Date;

  @IsOptional()
  @IsInt()
  cliente_id?: number;

  @IsOptional()
  @IsInt()
  fornecedor_id?: number;

  @IsOptional()
  @IsInt()
  orcamento_id?: number;

  @IsOptional()
  @IsInt()
  venda_id?: number;

  @IsOptional()
  @IsInt()
  plano_corte_id?: number;

  @IsOptional()
  @IsInt()
  projeto_id?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  equipe_ids?: number[];

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FuncionarioApontamentoDto)
  apontamentos?: FuncionarioApontamentoDto[];
}
