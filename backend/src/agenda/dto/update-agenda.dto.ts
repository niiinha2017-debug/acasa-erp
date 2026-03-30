import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FuncionarioApontamentoDto } from './create-agenda.dto';
import { ORIGENS_FLUXO, SETORES_DESTINO } from '../agenda-rules';

export class UpdateAgendaDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  cliente_nome_livre?: string;

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
  @IsArray()
  @IsInt({ each: true })
  automovel_ids?: number[];

  @IsOptional()
  @IsString()
  subetapa?: string;

  @IsOptional()
  @IsString()
  @IsIn(ORIGENS_FLUXO, { message: 'origem_fluxo inválida' })
  origem_fluxo?: string;

  @IsOptional()
  @IsString()
  @IsIn([...SETORES_DESTINO, 'PRODUCAO'], { message: 'setor_destino inválido' })
  setor_destino?: string;

  @IsOptional()
  @IsString()
  status?: string;

  /** Ambientes incluídos nesta tarefa (nomes). Vazio = todos. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ambientes_selecionados?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FuncionarioApontamentoDto)
  apontamentos?: FuncionarioApontamentoDto[];
}
