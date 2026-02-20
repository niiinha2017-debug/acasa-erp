import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsInt,
  IsArray,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FuncionarioApontamentoDto {
  @IsInt()
  funcionario_id: number;

  @IsDateString({}, { message: 'Data/hora de início do apontamento é inválida' })
  inicio_em: Date;

  @IsDateString({}, { message: 'Data/hora de término do apontamento é inválida' })
  fim_em: Date;
}

export class CreateAgendaDto {
  @IsString()
  @IsNotEmpty({ message: 'O título do agendamento é obrigatório' })
  titulo: string;

  @IsDateString({}, { message: 'Data de início inválida' })
  inicio_em: Date;

  @IsDateString({}, { message: 'Data de término inválida' })
  fim_em: Date;

  /** Cliente (obrigatório para venda/orçamento/projeto; opcional para plano de corte) */
  @ValidateIf((o) => !o.plano_corte_id)
  @IsInt()
  @IsNotEmpty({ message: 'Cliente ou Plano de Corte é obrigatório' })
  cliente_id?: number;

  /** Fornecedor (preenchido automaticamente quando plano_corte_id é informado) */
  @IsOptional()
  @IsInt()
  fornecedor_id?: number;

  // IDs de Vínculo (Opcionais)
  @IsOptional()
  @IsInt()
  orcamento_id?: number;

  @IsOptional()
  @IsInt()
  venda_id?: number;

  /** Plano de Corte (venda de metros de corte ao fornecedor) */
  @IsOptional()
  @IsInt()
  plano_corte_id?: number;

  @IsOptional()
  @IsInt()
  projeto_id?: number;

  /** Equipe (opcional; vazio no fluxo "Enviar para Produção") */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  equipe_ids?: number[];

  @IsOptional()
  @IsString()
  categoria?: string; // Agora não barra mais o 400 se não for enviado

  @IsOptional()
  @IsString()
  status?: string; // Ex: PENDENTE, EM_ANDAMENTO

  /** Apontamentos individuais de horas por funcionário dentro da tarefa */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FuncionarioApontamentoDto)
  apontamentos?: FuncionarioApontamentoDto[];
}
