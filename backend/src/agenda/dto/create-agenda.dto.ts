import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsInt,
  IsArray,
  ArrayMinSize,
  ValidateIf,
} from 'class-validator';

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

  // Validação da Equipe
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1, {
    message: 'Selecione pelo menos um funcionário para a equipe',
  })
  equipe_ids: number[];

  @IsOptional()
  @IsString()
  categoria?: string; // Agora não barra mais o 400 se não for enviado

  @IsOptional()
  @IsString()
  status?: string; // Ex: PENDENTE, EM_ANDAMENTO
}
