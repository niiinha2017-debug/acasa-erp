import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsInt,
  IsArray,
  ValidateIf,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ORIGENS_FLUXO, SETORES_DESTINO } from '../agenda-rules';

export class FuncionarioApontamentoDto {
  @IsInt()
  funcionario_id: number;

  @IsDateString(
    {},
    { message: 'Data/hora de início do apontamento é inválida' },
  )
  inicio_em: Date;

  @IsDateString(
    {},
    { message: 'Data/hora de término do apontamento é inválida' },
  )
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
  @ValidateIf((o) => {
    const origem = String(o.origem_fluxo || '').toUpperCase();
    const isTarefaExplicita = origem === 'TAREFA';
    const isTarefaInferidaSemVinculo =
      !origem && !o.plano_corte_id && !o.venda_id;
    return (
      !o.plano_corte_id && !isTarefaExplicita && !isTarefaInferidaSemVinculo
    );
  })
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
  @IsIn(ORIGENS_FLUXO, { message: 'origem_fluxo inválida' })
  origem_fluxo?: string; // PLANO_CORTE | VENDA_PLANO_CORTE | LOJA_VENDA | POS_VENDA | TAREFA

  @IsOptional()
  @IsString()
  @IsIn([...SETORES_DESTINO, 'PRODUCAO'], { message: 'setor_destino inválido' })
  setor_destino?: string; // LOJA | FABRICA

  @IsOptional()
  @IsString()
  status?: string; // Ex: PENDENTE, EM_ANDAMENTO

  /** Ambientes incluídos nesta tarefa (nomes). Vazio = todos da venda. Ex.: medição de 2 ambientes, resto fica pendente. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ambientes_selecionados?: string[];

  /** Apontamentos individuais de horas por funcionário dentro da tarefa */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FuncionarioApontamentoDto)
  apontamentos?: FuncionarioApontamentoDto[];
}
